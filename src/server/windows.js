export class WindowTracker {
    constructor() {
        this.windows = {}
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
}