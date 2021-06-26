import {GENERAL} from 'idealos_schemas/js/general.js'
import {GRAPHICS} from 'idealos_schemas/js/graphics.js'
import {INPUT} from 'idealos_schemas/js/input.js'
import {CLIENT_TYPES, make_response} from './connections.js'
import {is_window} from './windows.js'
import {MENUS} from 'idealos_schemas/js/menus.js'
import {DEBUG} from 'idealos_schemas/js/debug.js'
import {is_audio} from './audio.js'
import {is_translation} from './translations.js'
import {is_theme} from './themes.js'
import {APPS_GROUP, is_apps} from './apps.js'


function handle_font_load(msg, cons, server) {
    let resp = null
    if(!server.fonts[msg.name]) {
        resp = make_response(msg, {
            type: 'request-font-response',
            name:msg.name,
            succeeded: false,
        })
    } else {
        resp = make_response(msg,{
            type: 'request-font-response',
            succeeded: true,
            name:msg.name,
            font:server.fonts[msg.name]
        })
    }
    resp.app = msg.app
    // console.log("sending font to app",resp.app,resp)
    if(resp.app) {
        cons.forward_to_app(resp.app,resp)
    } else {
        cons.forward_to_screen(resp)
    }
    // cons.forward_to_screen(resp)
}

function perform_database_query(msg, cons, server) {
    console.log("searching database for",msg.query)
    let res = server.db.QUERY(msg.query)
    console.log("result is",res.length)
    server.cons.forward_to_app(msg.app,{
        type:"database-query-response",
        app:msg.app,
        docs:res,
    })
}

function perform_database_watch(msg, server) {
    console.log("watching db for",msg)
    server.db.addEventListener(msg.category,(obj)=>{
        console.log("db changed with object",msg.category,obj)
        server.cons.forward_to_app(msg.app,{
            type:"database-watch-update",
            app:msg.app,
            object:obj,
        })
    })
}
function perform_database_add(msg, server) {
    console.log("adding to database",msg)
    server.db.add(msg.object)
}

function is_input(msg) {
    if(msg.type === INPUT.TYPE_MouseDown) return true
    if(msg.type === INPUT.TYPE_MouseMove) return true
    if(msg.type === INPUT.TYPE_MouseUp) return true
    if(msg.type === INPUT.TYPE_KeyboardUp) return true
    if(msg.type === INPUT.TYPE_KeyboardDown) return true
    return false
}

export class EventRouter {
    constructor(server,cons,wids,apptracker) {
        this.server = server
        this.cons = cons// || throw new Error("missing cons")
        this.wids = wids// || throw new Error("missing wids")
        this.apptracker = apptracker
    }

    route(ws,msg) {
        if(msg.type === GENERAL.TYPE_Heartbeat) return do_nothing(msg)
        if(msg.type === GENERAL.TYPE_ScreenStart) return this.cons.handle_start_message(ws,msg,this.wids)
        if(msg.type === "SIDEBAR_START") return this.cons.add_connection(CLIENT_TYPES.SIDEBAR,msg.app,ws)
        if(msg.type === "DEBUG_LIST") return this.cons.add_connection(CLIENT_TYPES.DEBUG,msg.sender,ws)

        if(is_apps(msg)) this.server.at.handle(msg)
        if(is_window(msg)) return this.server.wids.handle(ws,msg)

        if(msg.type === MENUS.TYPE_SetMenubar) return this.cons.forward_to_menubar(msg)

        if(msg.type === GRAPHICS.TYPE_DrawRect
            || msg.type === GRAPHICS.TYPE_DrawPixel
            || msg.type === GRAPHICS.TYPE_DrawImage
        ) {
            let app = this.apptracker.get_app_by_id(msg.app)
            if(app.type === 'sub') {
                return this.cons.forward_to_parent_app(msg,app,this.apptracker.get_app_by_id(app.owner))
            } else {
                return this.cons.forward_to_screen(msg)
            }
        }

        if(msg.type === INPUT.TYPE_KeyboardDown) return this.server.kb.handle_keybindings(msg)
        if(is_input(msg)) return this.cons.forward_to_app(msg.app,msg)

        if(msg.type === INPUT.TYPE_Action) return forward_to_focused(msg,this.cons,this.wids)

        if(is_theme(msg)) return this.server.theme_manager.handle(msg)

        if(msg.type === 'request-font') return handle_font_load(msg,this.cons,this.server)

        if(msg.type === "database-query") return perform_database_query(msg,this.cons,this.server)
        if(msg.type === "database-watch") return perform_database_watch(msg,this.server)
        if(msg.type === "database-add")   return perform_database_add(msg,this.server)

        if(is_translation(msg)) return this.server.trans.handle(msg)
        if(is_audio(msg)) return this.server.audio.handle(msg)

        if(msg.type === 'group-message') {
            if(msg.category === 'graphics') {
                let app = this.apptracker.get_app_by_id(msg.app)
                if(app.type === 'sub') {
                    return this.cons.forward_to_parent_app(msg,app,
                        this.apptracker.get_app_by_id(app.owner))
                } else {
                    return this.cons.forward_to_screen(msg)
                }
            } else {
                msg.messages.forEach(msg2 => {
                    msg2.app = msg.app
                    msg2.trigger = msg.trigger
                    this.route(ws, msg2)
                })
            }
            return
        }

        if(msg.type === "debug-action-done") {
            console.log("bouncing back debug action done")
            return this.cons.forward_to_app(msg.app,msg)
        }

        this.log("unhandled message",msg)
    }

    log(...args) {
        console.log('ROUTER',...args)
    }

}

function do_nothing(msg) {}

function forward_to_focused(msg, cons, wids) {
    let win = wids.get_active_window()
    if(win && win.owner) return cons.forward_to_app(win.owner,msg)
}

