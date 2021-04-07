import WS from "ws"
import fs from "fs"
import http from "http"
import path from "path"
import {spawn} from "child_process"
import {
    DRAW_PIXEL,
    DRAWING,
    FILL_RECT,
    HEARTBEAT,
    MOUSE,
    OPEN_WINDOW,
    SCREEN
} from '../canvas/messages.js'
import {WindowTracker} from './windows.js'
const hostname = '127.0.0.1'
const webserver_port = 3000
const websocket_port = 8081

function log(...args) { console.log(...args) }
const sleep = (dur) => new Promise((res,rej) => setTimeout(res,dur))

const connections = {}
const wids = new WindowTracker()

function handle_start_message(ws,msg) {
    connections[SCREEN.SCREEN] = ws
    //send the current list of windows
    forward_to_screen({type:SCREEN.WINDOW_LIST, windows:wids.windows})
}

function handle_open_window_message(ws,msg) {
    log("app is opening a window",msg)
    if(msg.sender && !connections[msg.sender]) {
        connections[msg.sender] = ws
    }
    if(!connections[SCREEN.SCREEN]) {
        log("can't open a window because there is no screen")
    }
    let win_id = "id_"+Math.floor(Math.random()*10000)
    let y = wids.length()//Object.keys(windows).length
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
    forward_to_screen({ type:OPEN_WINDOW.SCREEN_NAME, target:msg.sender, window:wids.window_for_id(win_id)})
    //send response back to client
    forward_to_target({type:OPEN_WINDOW.RESPONSE_NAME, target:msg.sender, window:win_id})
}

function forward_to_screen(msg) {
    // log("sending to screen",msg)
    if(connections[SCREEN.SCREEN]) return connections[SCREEN.SCREEN].send(JSON.stringify(msg))
}

function do_nothing(msg) {
    //do nothing
}

function forward_to_target(msg) {
    if(!msg.target) return log("NO TARGET!",msg)
    return connections[msg.target].send(JSON.stringify(msg))
}

function start_message_server() {
    const server = new WS.Server({
        port: websocket_port,
    })
    log(`started websocket server on ws://${hostname}:${websocket_port}`)

    server.on("connection", (ws) => {
        ws.on("message", (m) => {
            let msg = JSON.parse(m)
            if(msg.type === SCREEN.START) return handle_start_message(ws,msg)
            if(msg.type === OPEN_WINDOW.NAME) return handle_open_window_message(ws,msg)
            if(msg.type === DRAW_PIXEL.NAME) return forward_to_screen(msg)
            if(msg.type === FILL_RECT.NAME) return forward_to_screen(msg)
            if(msg.type === OPEN_WINDOW.RESPONSE_NAME) return forward_to_target(msg)
            if(msg.type === HEARTBEAT.NAME) return do_nothing(msg)
            if(msg.type === MOUSE.UP.NAME)  return forward_to_target(msg)
            if(msg.type === MOUSE.DOWN.NAME) return forward_to_target(msg)
            if(msg.type === DRAWING.REFRESH_WINDOW) return forward_to_target(msg)
            log("incoming message", msg)
        })
        ws.send(JSON.stringify({message: 'CONNECTED'}))
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
}
async function start_app1() {
    let app = {
        name:'app1',
        path: 'src/clients/app1.js',
        args: [],
        id:"app_"+(Math.floor(Math.random()*100000))
    }
    await sleep(250)
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
    start_app(app)
}

await start_message_server()
await start_web_server()

function screen_connected() {
    log("waiting for the screen to connect. please refresh the page")
    return new Promise((res,rej)=>{
        let id = setInterval(()=>{
            if(connections[SCREEN.SCREEN]) {
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