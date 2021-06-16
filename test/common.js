import {default as WebSocket} from 'ws'
import {INPUT} from 'idealos_schemas/js/input.js'
import {WINDOWS} from 'idealos_schemas/js/windows.js'
import {GENERAL} from 'idealos_schemas/js/general.js'
import {GRAPHICS} from 'idealos_schemas/js/graphics.js'
import {hostname, websocket_port} from '../src/server/server.js'
import {App} from '../src/clients/toolkit/guitoolkit.js'

class BaseAppWrapper {
    constructor() {
        this.listeners = {}
    }

    log(...args) {
        console.log(this.name, ...args)
    }

    async wait_for_message(type) {
        return new Promise((res, rej) => {
            this.on(type, (msg) => {
                res(msg)
            })
        })
    }

    fire(type, msg) {
        if (this.listeners[type]) this.listeners[type].forEach(cb => cb(msg))
    }

    on(type, cb) {
        if (!this.listeners[type]) this.listeners[type] = []
        this.listeners[type].push(cb)
    }

    async send(msg) {
        return new Promise((res, rej) => {
            this.ws.send(JSON.stringify(msg), () => {
                res()
            })
        })
    }
}

class TestApp extends BaseAppWrapper {
    constructor(data, cb) {
        super()
        // console.log("data is",data)
        this.name = "APP:" + data.app.name
        this.id = data.app.id
        this.hostname = data.info.hostname
        this.port = data.info.websocket_port
        this.ws = new WebSocket(`ws://${this.hostname}:${this.port}`)
        this.ws.on("open", () => {
            console.log('client connected')
            try {
                cb(this).catch(e => console.error(e))
            } catch (e) {
                console.log("error inside test app function", e)
            }
        })
        this.ws.on('message', txt => {
            let msg = JSON.parse(txt)
            // this.log("incoming message",msg)
            setTimeout(() => {
                this.fire(msg.type, msg)
            }, 10)

        })
    }
    async send(msg) {
        msg.app = this.app._appid
        return new Promise((res, rej) => {
            this.ws.send(JSON.stringify(msg), () => {
                res()
            })
        })
    }
}

export async function start_testapp(server, cb) {
    return server.start_app_cb({
        name: "testapp"
    }).then((data) => {
        return new TestApp(data, cb)
    }).catch(e => {
        console.log("ERROR HAPPENED")
        console.error(e)
    })
}

class TestGUIApp extends BaseAppWrapper {
    constructor(data, cb) {
        super()
        let ws_url = `ws://${data.info.hostname}:${data.info.websocket_port}`
        this.name = "guiapp"
        this.app = new App([0, 1, ws_url, data.app.id])
        this.app.a_init().then(() => {
            console.log("done with init")
            try {
                cb(this).catch(e => console.error(e))
            } catch (e) {
                console.log("error inside test app function", e)
            }
        })
        this.app.on_all((m) => {
            this.fire(m.type, m.payload)
        })
    }
    async send(msg) {
        return new Promise((res, rej) => {
            msg.app = this.app._appid
            this.app.ws.send(JSON.stringify(msg), () => {
                res()
            })
        })
    }
}

export async function start_testguiapp(server, cb) {
    return server.start_app_cb({
        name: 'testapp'
    }).then(data => {
        return new TestGUIApp(data, cb)
    }).catch(e => console.error(e))
}

export class HeadlessDisplay extends BaseAppWrapper {
    constructor(hostname, port) {
        super()
        this.name = 'DISPLAY'
        this.listeners = {}
        this.windows = []
        this.ws = new WebSocket(`ws://${hostname}:${port}`)
        this.ws.on("open", () => this.log('connected'))
        this.ws.on('message', txt => {
            let msg = JSON.parse(txt)
            // this.log("incoming message",msg)
            setTimeout(() => {
                this.fire(msg.type, msg)
            }, 10)

            this.handle(msg)
        })
    }

    async dispatch_mousedown(opts) {
        let win = this.find_window_at(opts.x, opts.y)
        if (win) {
            let msg = INPUT.MAKE_MouseDown({
                app: win.owner,
                window: win.id,
                x: opts.x - win.x,
                y: opts.y - win.y
            })
            this.log("sending out", msg)
            await this.send(msg)
        } else {
            this.log(`no window found at`, opts)
            this.log(this.windows)
        }
    }

    async dispatch_mousemove(opts) {
    }

    async dispatch_mouseup(opts) {
        let win = this.find_window_at(opts.x, opts.y)
        if (win) {
            let msg = INPUT.MAKE_MouseUp({
                app: win.owner,
                window: win.id,
                x: opts.x - win.x,
                y: opts.y - win.y
            })
            this.log("sending out", msg)
            await this.send(msg)
        } else {
            this.log("no window found")
        }
    }

    handle(msg) {
        if (msg.type === WINDOWS.TYPE_WindowOpenDisplay) {
            this.windows.push(msg.window)
            return
        }
        if (msg.type === GENERAL.TYPE_ScreenStart) {
            return
        }
        if (msg.type === GENERAL.TYPE_Connected) {
            return
        }
        if (msg.type === WINDOWS.TYPE_create_child_window_display) {
            this.windows.push(msg.window)
            return
        }
        if (msg.type === WINDOWS.TYPE_window_list) return
        if (msg.type === GRAPHICS.TYPE_DrawRect) return
        if (msg.type === GRAPHICS.TYPE_DrawImage) return
        if (msg.type === WINDOWS.TYPE_WindowSetPosition) {
            let win = this.windows.find(win => win.id === msg.window)
            win.x = msg.x
            win.y = msg.y
        }
        this.log("unhandled", msg)
    }

    find_window_at(x, y) {
        return this.windows.find(win => {
            if (x < win.x) return false
            if (x > win.x + win.width) return false
            if (y < win.y) return false
            if (y > win.y + win.height) return false
            return true
        })
    }

    async dispatch_keydown(keyname) {
    }

    async dispatch_keydown_to_window(id, code, key, shift=false, control=false) {
        console.log('dispatching keydown to window', id, code, key,shift,control)
        let win = this.windows.find(win => win.id === id)
        let msg = INPUT.MAKE_KeyboardDown({
            code, key,
            shift: shift?shift:false,
            control:control?control:false,
            app: win.owner,
            window: win.id
        })
        await this.send(msg)
    }
}

export async function start_headless_display() {
    return new HeadlessDisplay(hostname, websocket_port)
}

export function log(...args) {
    console.log("TEST", ...args)
}