import {WINDOWS} from 'idealos_schemas/js/windows.js'

export class WindowTracker {
    constructor(sender) {
        this.windows = {}
        this.active_window = null
        this.send = sender
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
        console.log(...args)
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
}
