export class WindowTracker {
    constructor() {
        this.windows = {}
        this.active_window = null
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
        return this.windows[win_id]
    }

    window_for_id(win_id) {
        return this.windows[win_id]
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

    is_active_window(win) {
        return (win === this.active_window)
    }
}