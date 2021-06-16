import {GENERAL} from 'idealos_schemas/js/general.js'
import {WINDOWS} from 'idealos_schemas/js/windows.js'
import {GRAPHICS} from 'idealos_schemas/js/graphics.js'
import {INPUT} from 'idealos_schemas/js/input.js'
import {CLIENT_TYPES} from './connections.js'
import {WINDOW_TYPES} from './windows.js'
import {MENUS} from 'idealos_schemas/js/menus.js'
import {DEBUG} from 'idealos_schemas/js/debug.js'
import {INFO} from 'idealos_schemas/js/keyboard_map.js'


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
    cons.forward_to_screen(resp)
}

function perform_database_query(msg, cons, server) {
    console.log("searching database for",msg)
    server.db.query(msg.query).then(res => {
        console.log("result is",res)
        server.cons.forward_to_app(msg.app,{
            type:"database-query-response",
            app:msg.app,
            docs:res.docs,
        })
    })
}

export class EventRouter {
    constructor(cons,wids,apptracker,server) {
        this.cons = cons// || throw new Error("missing cons")
        this.wids = wids// || throw new Error("missing wids")
        this.apptracker = apptracker
        this.server = server
    }

    route(ws,msg) {
        if(msg.type === GENERAL.TYPE_Heartbeat) return do_nothing(msg)
        if(msg.type === GENERAL.TYPE_ScreenStart) return this.cons.handle_start_message(ws,msg,this.wids)
        if(msg.type === "SIDEBAR_START") return this.cons.add_connection(CLIENT_TYPES.SIDEBAR,msg.app,ws)

        if(msg.type === "LIST_ALL_APPS") return handle_list_all_apps(msg,this.cons,this.server.apps)
        if(msg.type === "DEBUG_LIST") return this.cons.add_connection(CLIENT_TYPES.DEBUG,msg.sender,ws)
        if(msg.type === "START_SUB_APP") return this.apptracker.start_sub_app(msg,this.cons)
        if(msg.type === DEBUG.TYPE_StartAppByName) return this.apptracker.start_app_by_name(msg.name);
        if(msg.type === DEBUG.TYPE_ListAppsRequest) {
            return this.cons.forward_to_debug(DEBUG.MAKE_ListAppsResponse({
                connection_count:this.cons.count(),
                apps:this.apptracker.list_apps(),
            }))
        }
        if(msg.type === DEBUG.TYPE_StopApp)  return this.apptracker.stop(msg.target)
        if(msg.type === DEBUG.TYPE_StartApp) return this.apptracker.start(msg.target)

        if(msg.type === WINDOWS.TYPE_WindowOpen) return handle_open_window_message(ws,msg,this.cons,this.wids,this.apptracker)
        if(msg.type === WINDOWS.TYPE_WindowOpenResponse) return this.cons.forward_to_target(msg)
        if(msg.type === WINDOWS.TYPE_create_child_window)  return handle_open_child_window_message(msg,this.cons,this.wids)
        if(msg.type === WINDOWS.TYPE_close_child_window)   return handle_close_child_window_message(msg,this.cons,this.wids)

        if(msg.type === WINDOWS.TYPE_window_refresh_request) return this.cons.forward_to_target(msg)
        if(msg.type === WINDOWS.TYPE_window_refresh_response) return this.cons.forward_to_target(msg)

        if(msg.type === WINDOWS.TYPE_WindowSetPosition) return set_window_position(msg,this.cons,this.wids)
        if(msg.type === 'window-set-size') return set_window_size(msg,this.cons,this.wids)
        if(msg.type === WINDOWS.TYPE_SetFocusedWindow) return handle_set_window_focused(msg,this.cons,this.wids)

        if(msg.type === WINDOWS.TYPE_window_close_response) return this.cons.forward_to_screen(msg)
        if(msg.type === WINDOWS.TYPE_window_close_request) return this.cons.forward_to_target(msg)

        if(msg.type === MENUS.TYPE_SetMenubar) return this.cons.forward_to_menubar(msg)


        // if(msg.type === GRAPHICS.TYPE_DrawPixel) return this.cons.forward_to_screen(msg)
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

        if(msg.type === INPUT.TYPE_MouseDown) return this.cons.forward_to_app(msg.app,msg)
        if(msg.type === INPUT.TYPE_MouseMove) return this.cons.forward_to_app(msg.app,msg)
        if(msg.type === INPUT.TYPE_MouseUp) return this.cons.forward_to_app(msg.app,msg)
        if(msg.type === INPUT.TYPE_KeyboardDown) return this.handle_keybindings(msg,this.server)
        if(msg.type === INPUT.TYPE_KeyboardUp) return this.cons.forward_to_app(msg.app,msg)

        if(msg.type === INPUT.TYPE_Action) return forward_to_focused(msg,this.cons,this.wids)

        if(msg.type === "get_control_theme") return get_control_theme(msg,this.cons,this.server)
        if(msg.type === "theme-set") return set_theme(msg,this.cons,this.server)

        if(msg.type === 'request-font') return handle_font_load(msg,this.cons,this.server)

        if(msg.type === "translation_get_value") return translation_get_value(msg,this.cons,this.server)
        if(msg.type === "translation_set_language") return translation_set_language(msg,this.cons,this.server)

        if(msg.type === "database-query") return perform_database_query(msg,this.cons,this.server)

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

        this.log("unhandled message",msg)
    }

    log(...args) {
        console.log('ROUTER',...args)
    }

    handle_keybindings(msg) {
        // console.log("keybindings",this.server.keybindings,msg)
        if(msg.type === INPUT.TYPE_KeyboardDown) {
            // console.log("msg is",msg)
            let binding = this.server.keybindings.bindings.find(e => e.code === msg.code && e.control === msg.control)
            if(binding) {
                // console.log('doing binding',binding)
                if(!binding.command) throw new Error("binding missing command " + JSON.stringify(binding) )
                this.server.cons.forward_to_app(msg.app,INPUT.MAKE_Action({
                    command:binding.command,
                    app:msg.app,
                    window:msg.window,
                }))
                return
            }
        }
        this.server.cons.forward_to_app(msg.app,msg)
    }
}

function do_nothing(msg) {}

function handle_open_window_message(ws,msg,cons,wids,apptracker) {
    if(!msg.sender) return log("open window message with no sender")
    ws.target = msg.sender
    // console.log("app opening window is",msg.app)
    if(apptracker.is_sub_app(msg.app)) {
        // console.log("its embedded. skipping the normal flow")
        cons.add_app_connection(msg.sender,ws)
        let resp = WINDOWS.MAKE_WindowOpenResponse({target:msg.sender, window:"som_win_id"+Math.random()})
        cons.forward_to_app(msg.sender,resp)
        let parent = apptracker.get_parent_of_sub_app(msg.app)
        cons.forward_to_app(parent.id,{type:"SUB_APP_WINDOW_OPEN",app:msg.app,window:resp.window})
        return
    }
    let win_id = wids.make_root_window(msg.window_type,msg.width,msg.height,msg.sender)
    if(msg.window_type === WINDOW_TYPES.MENUBAR) {
        cons.add_connection(CLIENT_TYPES.MENUBAR,msg.sender,ws)
    } else if(msg.window_type === WINDOW_TYPES.DOCK) {
        cons.add_connection(CLIENT_TYPES.DOCK,msg.sender,ws)
    } else {
        cons.add_app_connection(msg.sender,ws)
    }
    //send response to screen
    cons.forward_to_screen(WINDOWS.MAKE_WindowOpenDisplay({target:msg.sender, window:wids.window_for_id(win_id)}))
    //send response back to client
    cons.forward_to_app(msg.sender,WINDOWS.MAKE_WindowOpenResponse({target:msg.sender, window:win_id}))
}

function handle_open_child_window_message(msg,cons,wids) {
    if(!msg.sender) return log("open window message with no sender")
    let ch_win = wids.make_child_window(msg)
    wids.add_window(ch_win.id,ch_win)
    cons.forward_to_screen(WINDOWS.MAKE_create_child_window_display({
        // type:'CREATE_CHILD_WINDOW_DISPLAY',
        parent:msg.parent,
        window:ch_win,
        sender:msg.sender,
    }));
    cons.forward_to_app(msg.sender,WINDOWS.MAKE_create_child_window_response({
        // type:'CREATE_CHILD_WINDOW_RESPONSE',
        target:msg.sender,
        parent:msg.parent,
        window:ch_win,
        sender:msg.sender,
    }))
}

function handle_close_child_window_message(msg,cons,wids) {
    console.log("closing child window",msg.window)
    wids.close_child_window(msg.window)
    cons.forward_to_screen(WINDOWS.MAKE_close_child_window_display({
        target:msg.sender,
        parent:msg.parent,
        window:msg.window,
        sender:msg.sender,
    }))
    cons.forward_to_app(msg.sender,WINDOWS.MAKE_close_child_window_response({
        target:msg.sender,
        parent:msg.parent,
        window:msg.window,
        sender:msg.sender,
    }))
}


function set_window_position(msg,cons,wids) {
    let win = wids.window_for_id(msg.window)
    if(!win) return log(`no such window ${msg.window}`)
    if(!win.owner) return log(`window has no owner ${win.owner}`)
    wids.move_window(msg.window,msg.x,msg.y)
    cons.forward_to_app(win.owner,msg)
}

function set_window_size(msg,cons,wids) {
    let win = wids.window_for_id(msg.window)
    if(!win) return log(`no such window ${msg.window}`)
    if(!win.owner) return log(`window has no owner ${win.owner}`)
    wids.size_window(msg.window,msg.width,msg.height)
    cons.forward_to_app(win.owner,msg)
}

function handle_set_window_focused(msg,cons,wids) {
    let win = wids.window_for_id(msg.window)
    if(!win) return log(`no such window ${msg.window}`)
    if(!win.owner) return log(`window has no owner ${win.owner}`)
    //send focus lost to old window
    if(wids.get_active_window()) {
        let old_win = wids.get_active_window()
        cons.forward_to_app(old_win.owner,{
            type:"WINDOW_FOCUS_LOST",
            app:old_win.owner,
            window:old_win.id
        })
    }
    wids.set_active_window(win)
    cons.forward_to_app(win.owner,msg)
}

function forward_to_focused(msg, cons, wids) {
    let win = wids.get_active_window()
    if(win && win.owner) return cons.forward_to_app(win.owner,msg)
}

function handle_list_all_apps(msg, cons, apps) {
    cons.forward_to_app(msg.app,{
        type:"LIST_ALL_APPS_RESPONSE",
        target:msg.sender,
        apps:apps,
    })
}

function make_response(orig,settings) {
    let msg = {
        id: "msg_"+Math.floor((Math.random()*10000)),
        response_to:orig.id,
    }
    Object.entries(settings).forEach(([key,value])=>{
        msg[key] = value
    })
    return msg
}
function set_theme(msg,cons,server) {
    // console.log("vailable themese",server.themes)
    // console.log("target is",msg.name)
    if(!server.themes[msg.name]) {
        console.log(`missing theme name ${msg.name}`)
    } else {
        server.uitheme = server.themes[msg.name]
        return cons.forward_to_all_apps(make_response(msg,{type:"theme-changed",name:msg.name}))
    }
}
function get_control_theme(msg, cons, server) {
    // console.log("doing get control theme",msg, server.uitheme)
    if(!server.uitheme) {
        //if no theme loaded, use a default
        let msg2 = make_response(msg,{
            type:"get_control_theme_response",
            theme:{
                "background-color": "white",
                "color": "black",
                "border-color":'black'
            }
        })
        return cons.forward_to_app(msg.app, msg2)
    }
    // console.log('name is',msg.name)
    if(server.uitheme[msg.name]) {
        let msg2 = make_response(msg,{
            type:"get_control_theme_response",
            // id: "msg_"+Math.floor((Math.random()*10000)),
            // response_to:msg.id,
            theme: server.uitheme[msg.name]
        })
        return cons.forward_to_app(msg.app, msg2)
    } else {
        let msg2 = make_response(msg,{
            type:"get_control_theme_response",
            theme: server.uitheme['*']
        })
        return cons.forward_to_app(msg.app, msg2)
    }
}

function translation_get_value(msg, cons, server) {
    if(!server.active_translation) {
        return cons.forward_to_app(msg.app,make_response(msg,{
            type:"translation_get_value_response",
            key:msg.key,
            value:"[?]",
            succeeded:false,
        }))
    }
    if(!server.active_translation[msg.key]) {
        return cons.forward_to_app(msg.app,make_response(msg,{
            type:"translation_get_value_response",
            key:msg.key,
            value:"[?]",
            succeeded:false,
        }))
    }
    let value = server.active_translation[msg.key]
    return cons.forward_to_app(msg.app,make_response(msg,{
        type:"translation_get_value_response",
        key:msg.key,
        value:value,
        succeeded:true,
    }))
}

function translation_set_language(msg,cons,server) {
    // console.log("hanlding message",msg)
    let trans = server.translations.find(t => t.language === msg.language)
    // console.log("new trans is",trans)
    server.active_translation = trans
    console.log('sending to all apps',msg.app)
    return cons.forward_to_all_apps({
        type:"translation_language_changed",
        language:msg.language,
        succeeded:true,
    })
}
