import WS from "ws"
import fs from "fs"
import http from "http"
import path from "path"
import {spawn} from "child_process"
import {
    make_message, message_match,
    SCHEMAS,
} from '../canvas/messages.js'
import {WindowTracker} from './windows.js'
const hostname = '127.0.0.1'
const webserver_port = 3000
const websocket_port = 8081

function log(...args) {
    console.log(...args)
    forward_to_debug(make_message(SCHEMAS.DEBUG.LOG,{data:args}))
}
const sleep = (dur) => new Promise((res,rej) => setTimeout(res,dur))

const connections = {}
const wids = new WindowTracker()
const apps = []
let spawn_map = {}

const CLIENT_TYPES = {
    SCREEN:'SCREEN',
    DEBUG:'DEBUG',
}

function handle_start_message(ws,msg) {
    connections[CLIENT_TYPES.SCREEN] = ws
    forward_to_screen(make_message(SCHEMAS.SCREEN.WINDOW_LIST, {windows:wids.windows}))
}
function handle_open_window_message(ws,msg) {
    log("app is opening a window",msg)
    if(!msg.sender) return log("open window message with no sender")
    if(!connections[CLIENT_TYPES.SCREEN]) return log("can't open a window because there is no screen")

    if(!connections[msg.sender]) connections[msg.sender] = ws
    let win_id = "id_"+Math.floor(Math.random()*10000)
    let y = wids.length()
    wids.add_window(win_id, {
        id:win_id,
        width:msg.width,
        height:msg.height,
        x:1,
        y:y*10+1,
        owner:msg.sender,
        rects:[]
    })

    //send response to screen
    forward_to_screen(make_message(SCHEMAS.WINDOW.OPEN_SCREEN, {target:msg.sender, window:wids.window_for_id(win_id)}))
    //send response back to client
    forward_to_target(make_message(SCHEMAS.WINDOW.OPEN_RESPONSE, {target:msg.sender, window:win_id}))
}
function forward_to_screen(msg) {
    if(connections[CLIENT_TYPES.SCREEN]) return connections[CLIENT_TYPES.SCREEN].send(JSON.stringify(msg))
}
function forward_to_debug(msg) {
    if(connections[CLIENT_TYPES.DEBUG]) return connections[CLIENT_TYPES.DEBUG].send(JSON.stringify(msg))
}
function do_nothing(msg) {}
function forward_to_target(msg) {
    if(!msg.target) return log("NO TARGET!",msg)
    return connections[msg.target].send(JSON.stringify(msg))
}
function list_apps(ws,msg) {
    log("listing apps for debug message",msg)
    connections[DEBUG.CLIENT] = ws
    let response = make_message(SCHEMAS.DEBUG.LIST_RESPONSE,{
        connection_count:Object.keys(connections).length,
        apps:apps,
    })
    if(connections[msg.sender]) return connections[msg.sender].send(JSON.stringify(response))
}

function restart_app(msg) {
    let appid = msg.target
    if(spawn_map[appid]) {
        let child = spawn_map[appid]
        child.kill('SIGTERM')
        spawn_map[appid] = undefined
        let win = wids.windows_for_appid(appid)[0]
        forward_to_screen(make_message(SCHEMAS.WINDOW.CLOSE,{
                target:appid, window:{
                id:win.id,
                width:win.width,
                height:win.height,
                x:win.x,
                y:win.y,
                owner:win.owner,
            }}))
        wids.remove_windows_for_appid(appid)
        let app = apps.find(ap => ap.id === appid)
        start_app(app)
    }
}


function start_message_server() {
    const server = new WS.Server({
        port: websocket_port,
    })
    log(`started websocket server on ws://${hostname}:${websocket_port}`)

    server.on("connection", (ws) => {
        ws.on("message", (m) => {
            let msg = JSON.parse(m)
            forward_to_debug(msg)
            if(message_match(SCHEMAS.SCREEN.START,msg)) return handle_start_message(ws,msg)
            if(message_match(SCHEMAS.WINDOW.OPEN,msg)) return handle_open_window_message(ws,msg)
            if(message_match(SCHEMAS.WINDOW.OPEN_RESPONSE,msg)) return forward_to_target(msg)
            if(message_match(SCHEMAS.DRAW.PIXEL,msg)) return forward_to_screen(msg)
            if(message_match(SCHEMAS.DRAW.RECT,msg)) return forward_to_screen(msg)
            if(message_match(SCHEMAS.GENERAL.HEARTBEAT,msg)) return do_nothing(msg)
            if(message_match(SCHEMAS.MOUSE.DOWN,msg)) return forward_to_target(msg)
            if(message_match(SCHEMAS.MOUSE.UP,msg)) return forward_to_target(msg)
            if(message_match(SCHEMAS.WINDOW.REFRESH,msg)) return forward_to_target(msg)
            // if(msg.type === DEBUG.LIST) return list_apps(ws,msg)
            // if(msg.type === DEBUG.RESTART_APP_REQUEST) return restart_app(msg)
            log("incoming message", msg)
        })
        ws.send(JSON.stringify(make_message(SCHEMAS.GENERAL.CONNECTED,{})))
    })
}
function start_web_server() {
    return new Promise((res,rej)=>{
        const webserver = http.createServer((req, res) => {
            let file = path.resolve(path.join('src/canvas/', req.url))
            log(`${req.url}`)
            // log(`sending: ${file}`)
            fs.readFile(file, (err, data) => {
                if (err) {
                    log("error", err)
                    res.statusCode = 404
                    res.setHeader('Content-Type','text/plain')
                    res.write("Error: " + err.toString())
                    return
                }
                res.statusCode = 200
                if (file.endsWith('.js')) res.setHeader('Content-Type', 'application/javascript')
                if (file.endsWith('.html')) res.setHeader('Content-Type', 'text/html')
                res.write(data)
                res.end()
            })
        })
        webserver.listen(webserver_port, hostname, () => {
            log(`started webserver at http://${hostname}:${webserver_port}/screen.html`)
            res()
        })
    })
}


function start_app(app) {
    log('starting app',app)
    const child = spawn('node', [app.path,`ws://${hostname}:${websocket_port}`,app.id].concat(app.args))
    child.stdout.on('data',(data)=>log(`STDOUT ${app.name} ${data}`))
    child.stderr.on('data',(data)=>log(`STDERR ${app.name} ${data}`))
    child.on('exit',(code)=> log(`${app.name} ended with code = ${code}`))
    spawn_map[app.id] = child
}
async function start_app1() {
    let app = {
        name:'app1',
        path: 'src/clients/app1.js',
        args: [],
        id:"app_"+(Math.floor(Math.random()*100000))
    }
    await sleep(250)
    apps.push(app)
    start_app(app)
}
async function start_app2() {
    let app = {
        name:'app2',
        path: 'src/clients/app2.js',
        args: [],
        id:"app_"+(Math.floor(Math.random()*100000))
    }
    await sleep(250)
    apps.push(app)
    start_app(app)
}
async function start_app3() {
    let app = {
        name:'app3',
        path: 'src/clients/gui_test.js',
        args: [],
        id:"app_"+(Math.floor(Math.random()*100000))
    }
    await sleep(250)
    apps.push(app)
    start_app(app)
}

await start_message_server()
await start_web_server()

function screen_connected() {
    log("waiting for the screen to connect. please refresh the page")
    return new Promise((res,rej)=>{
        let id = setInterval(()=>{
            if(connections[CLIENT_TYPES.SCREEN]) {
                log("screen attached")
                clearInterval(id)
                res()
            }
        },500)
    })
}

await screen_connected()
await start_app1()
await start_app2()
await start_app3()
log('started everything')