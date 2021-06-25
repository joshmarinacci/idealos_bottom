import {WINDOWS} from 'idealos_schemas/js/windows.js'
import {CLIENT_TYPES} from './connections.js'

export const WINDOW_TYPES = {
    MENUBAR:'menubar',
    DOCK:'dock',
    PLAIN:'plain',
    SIDEBAR:'sidebar',
    DEBUG:'debug',
}

export class WindowTracker {
    constructor(sender, cons, server) {
        this.cons = cons
        this.windows = {}
        this.active_window = null
        this.send = sender
        this.server = server
    }
    handle(ws,msg) {
        // this.log(msg)
        if(msg.type === WINDOWS.TYPE_WindowOpen) return this.handle_open_window_message(ws,msg,this.server)
        if(msg.type === WINDOWS.TYPE_create_child_window)  return this.handle_open_child_window_message(msg,this.server)
        if(msg.type === WINDOWS.TYPE_close_child_window)   return this.handle_close_child_window_message(msg,this.server)
        if(msg.type === WINDOWS.TYPE_WindowSetPosition) return this.set_window_position(msg,this.server)
        if(msg.type === 'window-set-size') return this.set_window_size(msg,this.server)
        if(msg.type === WINDOWS.TYPE_SetFocusedWindow) return this.handle_set_window_focused(msg,this.server)
        if(msg.type === WINDOWS.TYPE_WindowOpenResponse) return this.server.cons.forward_to_target(msg)
        if(msg.type === WINDOWS.TYPE_window_refresh_request) return this.server.cons.forward_to_target(msg)
        if(msg.type === WINDOWS.TYPE_window_refresh_response) return this.server.cons.forward_to_target(msg)
        if(msg.type === WINDOWS.TYPE_window_close_response) return this.server.cons.forward_to_screen(msg)
        if(msg.type === WINDOWS.TYPE_window_close_request) return this.server.cons.forward_to_target(msg)
    }
    handle_set_window_focused(msg,server) {
        let win = server.wids.window_for_id(msg.window)
        if(!win) return log(`no such window ${msg.window}`)
        if(!win.owner) return log(`window has no owner ${win.owner}`)
        //send focus lost to old window
        if(server.wids.get_active_window()) {
            let old_win = server.wids.get_active_window()
            server.cons.forward_to_app(old_win.owner,{
                type:"WINDOW_FOCUS_LOST",
                app:old_win.owner,
                window:old_win.id
            })
        }
        server.wids.set_active_window(win)
        server.cons.forward_to_app(win.owner,msg)
    }

    handle_open_window_message(ws,msg,server) {
        if(!msg.sender) return log("open window message with no sender")
        ws.target = msg.sender
        console.log("app opening window is",msg.app)
        if(server.at.is_sub_app(msg.app)) {
            // console.log("its embedded. skipping the normal flow")
            server.cons.add_app_connection(msg.sender,ws)
            let resp = WINDOWS.MAKE_WindowOpenResponse({target:msg.sender, window:"som_win_id"+Math.random()})
            server.cons.forward_to_app(msg.sender,resp)
            let parent = server.at.get_parent_of_sub_app(msg.app)
            server.cons.forward_to_app(parent.id,{type:"SUB_APP_WINDOW_OPEN",app:msg.app,window:resp.window})
            return
        }
        let win_id = server.wids.make_root_window(msg.window_type,msg.width,msg.height,msg.sender)
        if(msg.window_type === WINDOW_TYPES.MENUBAR) {
            server.cons.add_connection(CLIENT_TYPES.MENUBAR,msg.sender,ws)
        } else if(msg.window_type === WINDOW_TYPES.DOCK) {
            server.cons.add_connection(CLIENT_TYPES.DOCK,msg.sender,ws)
        } else {
            server.cons.add_app_connection(msg.sender,ws)
        }
        //send response to screen
        server.cons.forward_to_screen(WINDOWS.MAKE_WindowOpenDisplay({target:msg.sender, window:server.wids.window_for_id(win_id)}))
        //send response back to client
        server.cons.forward_to_app(msg.sender,WINDOWS.MAKE_WindowOpenResponse({target:msg.sender, window:win_id}))
    }

    set_window_position(msg,server) {
        let win = server.wids.window_for_id(msg.window)
        if(!win) return log(`no such window ${msg.window}`)
        if(!win.owner) return log(`window has no owner ${win.owner}`)
        server.wids.move_window(msg.window,msg.x,msg.y)
        server.cons.forward_to_app(win.owner,msg)
    }

    set_window_size(msg,server) {
        let win = server.wids.window_for_id(msg.window)
        if(!win) return log(`no such window ${msg.window}`)
        if(!win.owner) return log(`window has no owner ${win.owner}`)
        server.wids.size_window(msg.window,msg.width,msg.height)
        server.cons.forward_to_app(win.owner,msg)
    }

    handle_open_child_window_message(msg,server) {
        if(!msg.sender) return log("open window message with no sender")
        let ch_win = server.wids.make_child_window(msg)
        server.wids.add_window(ch_win.id,ch_win)
        server.cons.forward_to_screen(WINDOWS.MAKE_create_child_window_display({
            // type:'CREATE_CHILD_WINDOW_DISPLAY',
            parent:msg.parent,
            window:ch_win,
            sender:msg.sender,
        }));
        server.cons.forward_to_app(msg.sender,WINDOWS.MAKE_create_child_window_response({
            // type:'CREATE_CHILD_WINDOW_RESPONSE',
            target:msg.sender,
            parent:msg.parent,
            window:ch_win,
            sender:msg.sender,
        }))
    }

    handle_close_child_window_message(msg,server) {
        console.log("closing child window",msg.window)
        server.wids.close_child_window(msg.window)
        server.cons.forward_to_screen(WINDOWS.MAKE_close_child_window_display({
            target:msg.sender,
            parent:msg.parent,
            window:msg.window,
            sender:msg.sender,
        }))
        server.cons.forward_to_app(msg.sender,WINDOWS.MAKE_close_child_window_response({
            target:msg.sender,
            parent:msg.parent,
            window:msg.window,
            sender:msg.sender,
        }))
    }


    find(pt) {
        return Object.values(this.windows).find(win => {
            if(pt.x < win.x) return false
            if(pt.x > win.x + win.width) return false
            if(pt.y < win.y) return false
            if(pt.y > win.y + win.height) return false
            return true
        })
    }
    add_window(id,win) {
        this.windows[id] = win
    }
    length() {
        return Object.keys(this.windows).length
    }

    has_window_id(win_id) {
        return this.windows[win_id]?true:false
    }

    window_for_id(win_id) {
        return this.windows[win_id]
    }
    windows_for_appid(appid) {
        return Object.values(this.windows).filter(win => win && win.owner === appid)
    }
    remove_windows_for_appid(appid) {
        Object.keys(this.windows).forEach(id => {
            if(this.windows[id] && this.windows[id].owner === appid) {
                this.windows[id] = undefined
                this.send(WINDOWS.MAKE_window_close_response({target:appid, window:id}))
            }
        })
    }

    sync_windows(windows) {
        Object.values(windows).forEach(win => {
            if(!this.has_window_id(win.id)) {
                // this.log("syncing in window",win)
                this.add_window(win.id,win)
            }
        })
    }

    log(...args) {
        console.log("WINDOW_TRACKER",...args)
    }

    set_active_window(win) {
        this.active_window = win
    }
    get_active_window() {
        return this.active_window
    }

    is_active_window(win) {
        return (win === this.active_window)
    }

    make_child_window(msg) {
        let win_id = "win_"+Math.floor(Math.random()*10000)
        let ch_win = {
            type:'child',
            id:win_id,
            width:msg.width,
            height:msg.height,
            x:msg.x,
            y:msg.y,
            owner:msg.sender,
            window_type: msg.style
        }
        // this.log("making a child window",ch_win)
        return ch_win
    }

    close_child_window(id) {
        if(this.windows[id]) this.windows[id] = undefined
    }

    move_window(id, x, y) {
        let win = this.window_for_id(id)
        win.x = x
        win.y = y
    }
    size_window(id, w,h) {
        let win = this.window_for_id(id)
        win.width = w
        win.height = h
    }

    make_root_window(window_type,width,height,owner) {
        let win_id = "win_"+Math.floor(Math.random()*10000)
        let y = this.length()+30
        let x = 40
        if(window_type === WINDOW_TYPES.MENUBAR) {
            x = 0
            y = 0
        }
        if(window_type === WINDOW_TYPES.DOCK) {
            x = 0
            y = 20
        }
        if(window_type === WINDOW_TYPES.SIDEBAR) {
            x = this.server.screens[0].width - width
            y = 20
        }
        if(window_type === WINDOW_TYPES.DEBUG) {
            x = 20
            y = this.server.screens[0].height - height
        }
        this.add_window(win_id, {
            type:'root',
            id:win_id,
            width:width,
            height:height,
            x:x,
            y:y,
            owner:owner,
            window_type:window_type,
        })
        return win_id
    }
}

export function is_window(msg) {
    if (msg.type === WINDOWS.TYPE_WindowOpen) return true
    if (msg.type === WINDOWS.TYPE_create_child_window) return true
    if (msg.type === WINDOWS.TYPE_close_child_window) return true
    if (msg.type === WINDOWS.TYPE_WindowSetPosition) return true
    if (msg.type === 'window-set-size') return true
    if (msg.type === WINDOWS.TYPE_SetFocusedWindow) return true
    if(msg.type === WINDOWS.TYPE_WindowOpenResponse) return true
    if(msg.type === WINDOWS.TYPE_window_refresh_request) return true
    if(msg.type === WINDOWS.TYPE_window_refresh_response) return true
    if(msg.type === WINDOWS.TYPE_window_close_response) return true
    if(msg.type === WINDOWS.TYPE_window_close_request) return true
    return false
}
