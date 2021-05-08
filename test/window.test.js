import {hostname, start_message_server, websocket_port} from '../src/server/server.js'
import {WINDOWS} from 'idealos_schemas/js/windows.js'
import {default as WebSocket} from 'ws'
import assert from 'assert'
import {GENERAL} from 'idealos_schemas/js/general.js'
import {INPUT} from 'idealos_schemas/js/input.js'


class TestApp {
    constructor(data,cb) {
        // console.log("data is",data)
        this.name = "APP:"+data.app.name
        this.id = data.app.id
        this.hostname = data.info.hostname
        this.port = data.info.websocket_port
        this.listeners = {}
        this.ws = new WebSocket(`ws://${this.hostname}:${this.port}`)
        this.ws.on("open",()=>{
            console.log('client connected')
            try {
                cb(this).catch(e => console.error(e))
            } catch (e) {
                console.log("error inside test app function", e)
            }
        })
        this.ws.on('message',txt => {
            let msg = JSON.parse(txt)
            this.log("incoming message",msg)
            setTimeout(()=>{
                this.fire(msg.type,msg)
            },10)

        })
    }

    log(...args) {
        console.log(this.name,...args)
    }

    async wait_for_message (type) {
        return new Promise((res,rej)=>{
            this.on(type,(msg)=>{
                res(msg)
            })
        })
    }

    fire(type, msg) {
        if(this.listeners[type]) this.listeners[type].forEach(cb => cb(msg))
    }

    on(type, cb) {
        if(!this.listeners[type]) this.listeners[type] = []
        this.listeners[type].push(cb)
    }
}
async function start_testapp(server,cb) {
    return server.start_app_cb({
        name:"testapp",
    }).then((data)=>{
        return new TestApp(data,cb)
    }).catch(e => console.error(e))
}

class HeadlessDisplay {
    constructor(hostname,port) {
        this.name = 'DISPLAY'
        this.listeners = {}
        this.windows = []
        this.ws = new WebSocket(`ws://${hostname}:${port}`)
        this.ws.on("open",()=> this.log('connected'))
        this.ws.on('message',txt => {
            let msg = JSON.parse(txt)
            // this.log("incoming message",msg)
            setTimeout(()=>{
                this.fire(msg.type,msg)
            },10)

            this.handle(msg)
        })
    }
    log(...args) {
        console.log(this.name,...args)
    }
    fire(type, msg) {
        if(this.listeners[type]) this.listeners[type].forEach(cb => cb(msg))
    }
    on(type, cb) {
        if(!this.listeners[type]) this.listeners[type] = []
        this.listeners[type].push(cb)
    }
    async wait_for_message (type) {
        return new Promise((res,rej)=>{
            this.on(type,(msg)=>{
                res(msg)
            })
        })
    }
    async send(msg) {
        return new Promise((res,rej) => {
            this.ws.send(JSON.stringify(msg), () => {
                res()
            })
        })
    }

    async dispatch_mousedown(opts) {
        this.log("displatching mouse down",opts.x,opts.y)
        let win = this.find_window_at(opts.x,opts.y)
        if(win) {
            this.log("found window under cursor", win)
            let msg = INPUT.MAKE_MouseDown({
                app: win.owner,
                window: win.id,
                x: opts.x,
                y: opts.y
            })
            await this.send(msg)
            return
        }

        this.log("no window. look for chrome")
        let chrome = this.find_window_at_chrome(opts.x,opts.y)
        this.log("found chrome",chrome)
    }

    async dispatch_mousemove(opts) {
    }
    async dispatch_mouseup(opts) {
    }

    handle(msg) {
        if(msg.type === WINDOWS.TYPE_WindowOpenDisplay) {
            this.log("window opened",msg)
            this.windows.push(msg.window)
            return
        }
        if(msg.type === GENERAL.TYPE_ScreenStart) {
            this.log("screen start back")
            return
        }
        if(msg.type === GENERAL.TYPE_Connected) {
            this.log("connected response")
            return
        }
        this.log("unhandled",msg)
    }

    find_window_at(x, y) {
        return this.windows.find(win => {
            if(x < win.x) return false
            if(x > win.x + win.width) return false
            if(y < win.y) return false
            if(y > win.y+win.height) return false
            return true
        })
    }
}

async function start_headless_display() {
    return new HeadlessDisplay(hostname,websocket_port)
}

describe('window drag test',function() {
    function log(...args) {
        console.log("TEST",...args)
    }

    it('creates a window', async function () {
        //start the server
        let server = await start_message_server()
        try {


            //start the display
            let display = await start_headless_display()
            await display.wait_for_message(GENERAL.TYPE_Connected)
            await display.send(GENERAL.MAKE_ScreenStart())

            //start the test app
            let app = await start_testapp(server,async (app)=>{
                app.ws.send(JSON.stringify(WINDOWS.MAKE_WindowOpen({
                    x:50,
                    y:50,
                    width:70,
                    height:80,
                    sender:app.id,
                    window_type:'plain'
                })))
            })
            log("got the app")

            //wait for the app to receive it's open window
            let open_msg = await app.wait_for_message(WINDOWS.TYPE_WindowOpenResponse)
            log("got the window open response",open_msg)
            assert.strictEqual(server.wids.has_window_id(open_msg.window),true)
            let win = server.wids.window_for_id(open_msg.window)
            assert.strictEqual(win.type,'root')
            assert.strictEqual(win.width,70)
            assert.strictEqual(win.height,80)

            {
                //set the focused window
                server.send(WINDOWS.MAKE_SetFocusedWindow({window: open_msg.window}))
                await app.wait_for_message(WINDOWS.TYPE_SetFocusedWindow)
                log("app is now the focused window")
            }

            //move the window
            {
                server.send(WINDOWS.MAKE_WindowSetPosition({
                    window: open_msg.window,
                    app: open_msg.target,
                    x:100,
                    y:100,
                }))
                let msg = await app.wait_for_message(WINDOWS.TYPE_WindowSetPosition)
                console.log("message was",msg)
                assert.strictEqual(msg.x,100)
                assert.strictEqual(msg.y,100)
                let win = server.wids.window_for_id(open_msg.window)
                log("now window is",win)
                assert.strictEqual(win.x,100)
                assert.strictEqual(win.y,100)
            }


            //send simple mouse down event
            // await display.dispatch_mousedown({x:55,y:65})
            // await app.wait_for_message(INPUT.TYPE_MouseDown)
            // console.log("basic mouse went through")

            //send mouse drag to the title bar
            // await display.dispatch_mousedown({x:55,y:55})
            // console.log('titlebar down')
            // await display.dispatch_mousemove({x:57,y:57})
            // await display.dispatch_mouseup({x:60,y:60})
            // await app.wait_for_message(server,"WINDOWS.TYPE_WindowSetPosition")
            /*
            assert.equal(msg.payload.x,55)
            assert.equal(msg.payload.y,65)

            await app.shutdown()
            await display.shutdown()
            await server.shutdown()

             */
            await server.shutdown()
        } catch(e) {
            console.error(e)
            await server.shutdown()
        }
    })
})
