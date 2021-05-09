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
import {MENUS} from 'idealos_schemas/js/menus.js'

export const hostname = '127.0.0.1'
export const webserver_port = 3000
export const websocket_port = 8081

function log(...args) {
    console.log(...args)
    forward_to_debug(GENERAL.MAKE_Log({data:args}))
}

const connections = {}
const wids = new WindowTracker(send_delegate)
const at = new AppTracker(hostname,websocket_port,log,wids,send_delegate)
function send_delegate(msg) {
    forward_to_screen(msg)
}


const CLIENT_TYPES = {
    SCREEN:'SCREEN',
    DEBUG:'DEBUG',
    TEST:'TEST',
    MENUBAR:'MENUBAR',
    DOCK:'DOCK'
}

const WINDOW_TYPES = {
    MENUBAR:'menubar',
    DOCK:'dock',
    PLAIN:'plain',
}

let resources = new ResourceManager(log, respond)

function handle_start_message(ws,msg) {
    log("assigned to screen",CLIENT_TYPES.SCREEN)
    connections[CLIENT_TYPES.SCREEN] = ws
    forward_to_screen(WINDOWS.MAKE_window_list({windows:wids.windows}))
}
function handle_open_window_message(ws,msg) {
    // log("app is opening a window",msg)
    if(!msg.sender) return log("open window message with no sender")
    // if(!connections[CLIENT_TYPES.SCREEN]) return log("can't open a window because there is no screen")

    if(!connections[msg.sender]) connections[msg.sender] = ws
    ws.target = msg.sender
    let win_id = "win_"+Math.floor(Math.random()*10000)
    let y = wids.length()+30
    let x = 40
    if(msg.window_type === WINDOW_TYPES.MENUBAR) {
        x = 0
        y = 0
        connections[CLIENT_TYPES.MENUBAR] = ws
    }
    if(msg.window_type === WINDOW_TYPES.DOCK) {
        x = 0
        y = 20
        connections[CLIENT_TYPES.DOCK] = ws
    }
    wids.add_window(win_id, {
        type:'root',
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
    if(!connections[msg.target]) {
        let keys = Object.keys(connections).join(" ")
        return log(`TARGET missing ${msg.target}. valid targets${keys}`)
    }
    return connections[msg.target].send(JSON.stringify(msg))
}
function forward_to_app(msg) {
    if(!msg.app) return log("NO TARGET!",msg)
    if(!connections[msg.app]) {
        let keys = Object.keys(connections).join(" ")
        return log(`TARGET missing ${msg.app}. valid targets${keys}`)
    }
    return connections[msg.app].send(JSON.stringify(msg))
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

function respond(msg,resp) {
    resp.target = msg.sender
    forward_to_target(resp)
}

function handle_set_window_focused(msg) {
    let win = wids.window_for_id(msg.window)
    if(!win) return log(`no such window ${msg.window}`)
    if(!win.owner) return log(`window has no owner ${win.owner}`)
    wids.set_active_window(win)
    if(!connections[win.owner]) return console.error(`no app is running for the window ${win.id}`)
    return connections[win.owner].send(JSON.stringify(msg))
}

function forward_to_focused(msg) {
    let win = wids.get_active_window()
    if(win && win.owner) return connections[win.owner].send(JSON.stringify(msg))
}

function set_window_position(msg) {
    let win = wids.window_for_id(msg.window)
    if(!win) return log(`no such window ${msg.window}`)
    if(!win.owner) return log(`window has no owner ${win.owner}`)
    wids.move_window(msg.window,msg.x,msg.y)
    forward_to_app(msg)
}

function dispatch(msg,ws) {
    try {
        // console.log("server displatching",msg)
        forward_to_debug(msg)
        if(msg.type === GENERAL.TYPE_Heartbeat) return do_nothing(msg)
        if(msg.type === GENERAL.TYPE_ScreenStart) return handle_start_message(ws,msg)

        if(msg.type === WINDOWS.TYPE_WindowOpen) return handle_open_window_message(ws,msg)
        if(msg.type === WINDOWS.TYPE_WindowOpenResponse) return forward_to_target(msg)
        if(msg.type === WINDOWS.TYPE_window_refresh_request) return forward_to_target(msg)
        if(msg.type === WINDOWS.TYPE_window_refresh_response) return forward_to_target(msg)
        if(msg.type === WINDOWS.TYPE_window_close_response) return forward_to_screen(msg)
        if(msg.type === WINDOWS.TYPE_window_close_request) return forward_to_target(msg)
        if(msg.type === WINDOWS.TYPE_create_child_window)  return handle_open_child_window_message(msg)
        if(msg.type === WINDOWS.TYPE_close_child_window)   return handle_close_child_window_message(msg)
        if(msg.type === WINDOWS.TYPE_WindowSetPosition) return set_window_position(msg)

        if(msg.type === GRAPHICS.TYPE_DrawPixel) return forward_to_screen(msg)
        if(msg.type === GRAPHICS.TYPE_DrawRect) return forward_to_screen(msg)
        if(msg.type === GRAPHICS.TYPE_DrawImage) return forward_to_screen(msg)

        if(msg.type === INPUT.TYPE_MouseDown) return forward_to_app(msg)
        if(msg.type === INPUT.TYPE_MouseMove) return forward_to_app(msg)
        if(msg.type === INPUT.TYPE_MouseUp) return forward_to_app(msg)
        if(msg.type === INPUT.TYPE_KeyboardDown) return forward_to_app(msg)
        if(msg.type === INPUT.TYPE_KeyboardUp) return forward_to_app(msg)

        if(msg.type === WINDOWS.TYPE_SetFocusedWindow) return handle_set_window_focused(msg)
        if(msg.type === MENUS.TYPE_SetMenubar) return forward_to_menubar(msg)

        if(msg.type === DEBUG.TYPE_ListAppsRequest) return list_apps(ws,msg)
        if(msg.type === DEBUG.TYPE_RestartApp) return at.restart(msg.target)
        if(msg.type === DEBUG.TYPE_StopApp) return at.stop(msg.target)
        if(msg.type === DEBUG.TYPE_StartApp) return at.start(msg.target)
        if(msg.type === DEBUG.TYPE_StartAppByName) return at.start_app_by_name(msg.name)

        if(msg.type === DEBUG.TYPE_TestStart) return start_test(ws,msg)

        if(msg.type === RESOURCES.TYPE_ResourceGet) return resources.get_resource(msg)
        if(msg.type === INPUT.TYPE_Action) return forward_to_focused(msg)
        // if (msg.type === RESOURCES.TYPE_ResourceSet) return resources.set_resource(msg)
        // if (message_match(SCHEMAS.RESOURCE.SET, msg)) return resources.set_resource(msg)
        // if(message_match('CREATE_MENU_TREE',msg)) return forward_to_menubar(msg)

        log("SERVER: unknown incoming message", msg)
    } catch (e) {
        log("ERROR",e)
    }

}
export function start_message_server() {
    const server = new WS.Server({
        port: websocket_port,
    })
    log(`started websocket server on ws://${hostname}:${websocket_port}`)

    server.on("connection", (ws) => {
        ws.on("message", (m) => {
            let msg = JSON.parse(m)
            dispatch(msg,ws)
        })
        ws.on('close',(code)=>{
            delete connections[ws.target]
        })
        ws.send(JSON.stringify(GENERAL.MAKE_Connected({})))
    })
    server.on("close",(m) => {
        log('server closed',m)
    })
    server.on('error',(e)=>{
        log("server error",e)
    })

    return {
        wsserver:server,
        wids:wids,
        start_app_cb:async (opts) => {
            let app = at.create_app(opts)
            return {
                app:app,
                info:at.start_cb(app.id)
            }
        },
        start_app: async (opts) => {
            let app = at.create_app(opts)
            await sleep(250)
            at.start(app.id)
        },
        shutdown: async() => {
            log("stopping the server")
            return new Promise((res,rej)=>{
                server.close(()=>{
                    console.log('close is done')
                    res()
                })
                log("stopped")
            })
        },
        send:async(msg) => {
            dispatch(msg)
        }
    }
}
