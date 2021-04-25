import WS from "ws"
import fs from "fs"
import http from "http"
import path from "path"
import {WindowTracker} from './windows.js'
import {AppTracker} from './apps.js'
import {ResourceManager} from './resources.js'
import {sleep} from '../common.js'
import {WINDOWS} from "idealos_schemas/js/windows.js"
import {RESOURCES} from "idealos_schemas/js/resources.js"
import {INPUT} from "idealos_schemas/js/input.js"
import {DEBUG} from "idealos_schemas/js/debug.js"
import {GRAPHICS} from "idealos_schemas/js/graphics.js"
import {GENERAL} from "idealos_schemas/js/general.js"

export const hostname = '127.0.0.1'
export const webserver_port = 3000
export const websocket_port = 8081

function log(...args) {
    console.log(...args)
    forward_to_debug(GENERAL.MAKE_Log({data:args}))
}

const connections = {}
const wids = new WindowTracker()
const at = new AppTracker(hostname,websocket_port,log)


const CLIENT_TYPES = {
    SCREEN:'SCREEN',
    DEBUG:'DEBUG',
    TEST:'TEST',
    MENUBAR:'MENUBAR',
}

let resources = new ResourceManager(log, respond)

function handle_start_message(ws,msg) {
    log("assigned to screen",CLIENT_TYPES.SCREEN)
    connections[CLIENT_TYPES.SCREEN] = ws
    forward_to_screen(WINDOWS.MAKE_window_list({windows:wids.windows}))
}
function handle_open_window_message(ws,msg) {
    log("app is opening a window",msg)
    if(!msg.sender) return log("open window message with no sender")
    if(!connections[CLIENT_TYPES.SCREEN]) return log("can't open a window because there is no screen")

    if(!connections[msg.sender]) connections[msg.sender] = ws
    ws.target = msg.sender
    let win_id = "win_"+Math.floor(Math.random()*10000)
    let y = wids.length()+30
    let x = 10
    if(msg.window_type === 'menubar') {
        x = 0
        y = 0
    }
    wids.add_window(win_id, {
        id:win_id,
        width:msg.width,
        height:msg.height,
        x:x,
        y:y,
        owner:msg.sender,
        rects:[],
        window_type:msg.window_type,
    })

    //send response to screen
    forward_to_screen(WINDOWS.MAKE_WindowOpenDisplay({target:msg.sender, window:wids.window_for_id(win_id)}))
    //send response back to client
    forward_to_target(WINDOWS.MAKE_WindowOpenResponse({target:msg.sender, window:win_id}))
}

function handle_open_child_window_message(msg) {
    if(!msg.sender) return log("open window message with no sender")
    let ch_win = wids.make_child_window(msg)
    wids.add_window(ch_win.id,ch_win)
    forward_to_screen(WINDOWS.MAKE_create_child_window_display({
        // type:'CREATE_CHILD_WINDOW_DISPLAY',
        parent:msg.parent,
        window:ch_win,
        sender:msg.sender,
    }));
    forward_to_target(WINDOWS.MAKE_create_child_window_response({
        // type:'CREATE_CHILD_WINDOW_RESPONSE',
        target:msg.sender,
        parent:msg.parent,
        window:ch_win,
        sender:msg.sender,
    }))
}

function handle_close_child_window_message(msg) {
    log("closing child window",msg.window)
    wids.close_child_window(msg.window)
    forward_to_screen(WINDOWS.MAKE_close_child_window_display({
        target:msg.sender,
        parent:msg.parent,
        window:msg.window,
        sender:msg.sender,
    }))
    forward_to_target(WINDOWS.MAKE_close_child_window_response({
        target:msg.sender,
        parent:msg.parent,
        window:msg.window,
        sender:msg.sender,
    }))
}

function forward_to_screen(msg) {
    if(connections[CLIENT_TYPES.SCREEN]) return connections[CLIENT_TYPES.SCREEN].send(JSON.stringify(msg))
}
function forward_to_debug(msg) {
    if(connections[CLIENT_TYPES.DEBUG]) return connections[CLIENT_TYPES.DEBUG].send(JSON.stringify(msg))
}
function forward_to_menubar(msg) {
    if(connections[CLIENT_TYPES.MENUBAR]) return connections[CLIENT_TYPES.MENUBAR].send(JSON.stringify(msg))
}
function do_nothing(msg) {}
function forward_to_target(msg) {
    if(!msg.target) return log("NO TARGET!",msg)
    return connections[msg.target].send(JSON.stringify(msg))
}
function start_test(ws,msg) {
    log("attaching unit test runner")
    connections[CLIENT_TYPES.TEST] = ws;
}
function list_apps(ws,msg) {
    log("listing apps for debug message",msg)
    connections[CLIENT_TYPES.DEBUG] = ws
    let response = DEBUG.MAKE_ListAppsResponse({
        connection_count:Object.keys(connections).length,
        apps:at.list_apps(),
    })
    if(connections[CLIENT_TYPES.DEBUG]) return connections[CLIENT_TYPES.DEBUG].send(JSON.stringify(response))
}

function restart_app(msg) {
    log("restarting app",msg)
        // at.start(appid)
    // }
}

function stop_app(msg) {
    console.log("stopping app",msg)
    let appid = msg.target
    if(at.has_app(appid)) {
        at.stop(appid)
        // wids.windows_for_appid(appid).forEach(win => {
        //     forward_to_screen(WINDOWS.MAKE_close_child_window_display({
        //         target: appid,
        //         window: {
        //             id: win.id,
        //             width: win.width,
        //             height: win.height,
        //             x: win.x,
        //             y: win.y,
        //             owner: win.owner,
        //             window_type:win.window_type,
        //         }
        //     }))
        // })
        wids.remove_windows_for_appid(appid)
    }
}
function start_app(msg) {
    log("trying to start the app",msg)
    let appid = msg.target
    if(at.has_app(appid)) {
        at.start(appid)
    }
}


function respond(msg,resp) {
    resp.target = msg.sender
    forward_to_target(resp)
}


export function start_message_server() {
    const server = new WS.Server({
        port: websocket_port,
    })
    log(`started websocket server on ws://${hostname}:${websocket_port}`)

    server.on("connection", (ws) => {
        ws.on("message", (m) => {
            try {
                let msg = JSON.parse(m)
                forward_to_debug(msg)
                if(msg.type === GENERAL.TYPE_Heartbeat) return do_nothing(msg)
                if(msg.type === GENERAL.TYPE_ScreenStart) return handle_start_message(ws,msg)

                if(msg.type === WINDOWS.TYPE_WindowOpen) return handle_open_window_message(ws,msg)
                if(msg.type === WINDOWS.TYPE_WindowOpenResponse) return forward_to_target(msg)
                if(msg.type === WINDOWS.TYPE_window_refresh_request) return forward_to_target(msg)
                if(msg.type === WINDOWS.TYPE_window_refresh_response) return forward_to_target(msg)
                if(msg.type === WINDOWS.TYPE_window_close) return forward_to_screen(msg)
                if(msg.type === WINDOWS.TYPE_create_child_window)  return handle_open_child_window_message(msg)
                if(msg.type === WINDOWS.TYPE_close_child_window)   return handle_close_child_window_message(msg)

                if(msg.type === GRAPHICS.TYPE_DrawPixel) return forward_to_screen(msg)
                if(msg.type === GRAPHICS.TYPE_DrawRect) return forward_to_screen(msg)
                if(msg.type === GRAPHICS.TYPE_DrawImage) return forward_to_screen(msg)

                if(msg.type === INPUT.TYPE_MouseDown) return forward_to_target(msg)
                if(msg.type === INPUT.TYPE_MouseUp) return forward_to_target(msg)
                if(msg.type === INPUT.TYPE_KeyboardDown) return forward_to_target(msg)
                if(msg.type === INPUT.TYPE_KeyboardUp) return forward_to_target(msg)

                if(msg.type === DEBUG.TYPE_ListAppsRequest) return list_apps(ws,msg)
                if(msg.type === DEBUG.TYPE_RestartApp) return restart_app(msg)
                if(msg.type === DEBUG.TYPE_StopApp) return stop_app(msg)
                if(msg.type === DEBUG.TYPE_StartApp) return start_app(msg)

                if(msg.type === DEBUG.TYPE_TestStart) return start_test(ws,msg)

                if(msg.type === RESOURCES.TYPE_ResourceGet) return resources.get_resource(msg)
                // if (msg.type === RESOURCES.TYPE_ResourceSet) return resources.set_resource(msg)
                // if (message_match(SCHEMAS.RESOURCE.SET, msg)) return resources.set_resource(msg)
                // if(message_match('CREATE_MENU_TREE',msg)) return forward_to_menubar(msg)

                log("unknown incoming message", msg)
            } catch (e) {
                log("ERROR",e)
            }
        })
        ws.on('close',(code)=>{
            delete connections[ws.target]
        })
        ws.send(JSON.stringify(GENERAL.MAKE_Connected({})))
    })
    async function do_start_app(opts) {
    }


    return {
        wsserver:server,
        screen_connected: () => {
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
        },
        start_app:async (opts) => {
            let app = at.create_app(opts)
            await sleep(250)
            at.start(app.id)
        },
    }
}
export function stop_message_server(server) {
    log('stopping the server');
    server.wsserver.close()
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


// await start_message_server()
// await start_web_server()

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

// await screen_connected()
// await do_start_app({name:'dotclock', path:'src/clients/app1.js',args:[]});
// await do_start_app({name:'app2', path:'src/clients/app2.js',args:[]});
// await do_start_app({name:'guitest', path:'src/clients/gui_test.js',args:[]});
// await do_start_app({name:'fractal', path:'src/clients/fractal.js',args:[]});
log('started everything')