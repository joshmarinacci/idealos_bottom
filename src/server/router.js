import {GENERAL} from 'idealos_schemas/js/general.js'
import {WINDOWS} from 'idealos_schemas/js/windows.js'
import {GRAPHICS} from 'idealos_schemas/js/graphics.js'
import {INPUT} from 'idealos_schemas/js/input.js'
import {CLIENT_TYPES} from './connections.js'
import {WINDOW_TYPES} from './windows.js'
import {MENUS} from 'idealos_schemas/js/menus.js'

export class EventRouter {
    constructor(cons,wids) {
        this.cons = cons// || throw new Error("missing cons")
        this.wids = wids// || throw new Error("missing wids")
    }

    route(ws,msg) {
        if(msg.type === GENERAL.TYPE_Heartbeat) return do_nothing(msg)
        if(msg.type === GENERAL.TYPE_ScreenStart) return this.cons.handle_start_message(ws,msg,this.wids)

        if(msg.type === WINDOWS.TYPE_WindowOpen) return handle_open_window_message(ws,msg,this.cons,this.wids)
        if(msg.type === WINDOWS.TYPE_WindowOpenResponse) return this.cons.forward_to_target(msg)
        if(msg.type === WINDOWS.TYPE_create_child_window)  return handle_open_child_window_message(msg,this.cons,this.wids)
        if(msg.type === WINDOWS.TYPE_close_child_window)   return handle_close_child_window_message(msg,this.cons,this.wids)

        if(msg.type === WINDOWS.TYPE_window_refresh_request) return this.cons.forward_to_target(msg)
        if(msg.type === WINDOWS.TYPE_window_refresh_response) return this.cons.forward_to_target(msg)

        if(msg.type === WINDOWS.TYPE_WindowSetPosition) return set_window_position(msg,this.cons,this.wids)
        if(msg.type === WINDOWS.TYPE_SetFocusedWindow) return handle_set_window_focused(msg,this.cons,this.wids)

        if(msg.type === WINDOWS.TYPE_window_close_response) return this.cons.forward_to_screen(msg)
        if(msg.type === WINDOWS.TYPE_window_close_request) return this.cons.forward_to_target(msg)

        if(msg.type === MENUS.TYPE_SetMenubar) return this.cons.forward_to_menubar(msg)


        if(msg.type === GRAPHICS.TYPE_DrawPixel) return this.cons.forward_to_screen(msg)
        if(msg.type === GRAPHICS.TYPE_DrawRect) return this.cons.forward_to_screen(msg)
        if(msg.type === GRAPHICS.TYPE_DrawImage) return this.cons.forward_to_screen(msg)


        if(msg.type === INPUT.TYPE_MouseDown) return this.cons.forward_to_app(msg.app,msg)
        if(msg.type === INPUT.TYPE_MouseMove) return this.cons.forward_to_app(msg.app,msg)
        if(msg.type === INPUT.TYPE_MouseUp) return this.cons.forward_to_app(msg.app,msg)
        if(msg.type === INPUT.TYPE_KeyboardDown) return this.cons.forward_to_app(msg.app,msg)
        if(msg.type === INPUT.TYPE_KeyboardUp) return this.cons.forward_to_app(msg.app,msg)

        if(msg.type === INPUT.TYPE_Action) return forward_to_focused(msg,this.cons,this.wids)

        this.log("unhandled message",msg)
    }

    log(...args) {
        console.log('ROUTER',...args)
    }
}

function do_nothing(msg) {}

function handle_open_window_message(ws,msg,cons,wids) {
    if(!msg.sender) return log("open window message with no sender")
    ws.target = msg.sender
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

function handle_set_window_focused(msg,cons,wids) {
    let win = wids.window_for_id(msg.window)
    if(!win) return log(`no such window ${msg.window}`)
    if(!win.owner) return log(`window has no owner ${win.owner}`)
    wids.set_active_window(win)
    cons.forward_to_app(win.owner,msg)
}

function forward_to_focused(msg, cons, wids) {
    let win = wids.get_active_window()
    if(win && win.owner) return cons.forward_to_app(win.owner,msg)
}
