import {hostname, start_message_server, websocket_port} from '../src/server/server.js'
import {WINDOWS} from 'idealos_schemas/js/windows.js'
import {default as WebSocket} from 'ws'
import assert from 'assert'
import {GENERAL} from 'idealos_schemas/js/general.js'
import {INPUT} from 'idealos_schemas/js/input.js'
import {DEBUG} from 'idealos_schemas/js/debug.js'
import {MENUS} from 'idealos_schemas/js/menus.js'
import {GRAPHICS} from 'idealos_schemas/js/graphics.js'
import {App} from '../src/clients/guitoolkit.js'
import {sleep} from '../src/common.js'

class BaseAppWrapper {
    constructor() {
        this.listeners = {}
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
    async send(msg) {
        return new Promise((res,rej) => {
            this.ws.send(JSON.stringify(msg), () => {
                res()
            })
        })
    }
}

class TestApp extends BaseAppWrapper {
    constructor(data,cb) {
        super()
        // console.log("data is",data)
        this.name = "APP:"+data.app.name
        this.id = data.app.id
        this.hostname = data.info.hostname
        this.port = data.info.websocket_port
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
}

async function start_testapp(server,cb) {
    return server.start_app_cb({
        name:"testapp",
    }).then((data)=>{
        return new TestApp(data,cb)
    }).catch(e => console.error(e))
}

class TestGUIApp extends  BaseAppWrapper {
    constructor(data, cb) {
        super()
        let ws_url = `ws://${data.info.hostname}:${data.info.websocket_port}`
        this.app = new App([0,1,ws_url,data.app.id])
        this.app.a_init().then(()=>{
            console.log("done with init")
            try {
                cb(this).catch(e => console.error(e))
            } catch (e) {
                console.log("error inside test app function", e)
            }
        })
    }
}


async function start_testguiapp(server, cb) {
    return server.start_app_cb({
        name:'testapp'
    }).then(data => {
        return new TestGUIApp(data,cb)
    }).catch(e => console.error(e))
}


class HeadlessDisplay extends BaseAppWrapper {
    constructor(hostname,port) {
        super()
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

    async dispatch_mousedown(opts) {
        let win = this.find_window_at(opts.x,opts.y)
        if(win) {
            let msg = INPUT.MAKE_MouseDown({
                app: win.owner,
                window: win.id,
                x: opts.x-win.x,
                y: opts.y-win.y
            })
            this.log("sending out",msg)
            await this.send(msg)
        } else {
            this.log("no window found")
        }
    }

    async dispatch_mousemove(opts) {
    }
    async dispatch_mouseup(opts) {
        let win = this.find_window_at(opts.x,opts.y)
        if(win) {
            let msg = INPUT.MAKE_MouseUp({
                app: win.owner,
                window: win.id,
                x: opts.x-win.x,
                y: opts.y-win.y
            })
            this.log("sending out",msg)
            await this.send(msg)
        } else {
            this.log("no window found")
        }
    }

    handle(msg) {
        if(msg.type === WINDOWS.TYPE_WindowOpenDisplay) {
            this.windows.push(msg.window)
            return
        }
        if(msg.type === GENERAL.TYPE_ScreenStart) {
            return
        }
        if(msg.type === GENERAL.TYPE_Connected) {
            return
        }
        if(msg.type === WINDOWS.TYPE_create_child_window_display) {
            this.windows.push(msg.window)
            return
        }
        if(msg.type === WINDOWS.TYPE_window_list) return;
        if(msg.type === GRAPHICS.TYPE_DrawRect) return;
        if(msg.type === GRAPHICS.TYPE_DrawImage) return;
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

    async dispatch_keydown(keyname) {
    }

    async dispatch_keydown_to_window(id, keyname) {
        console.log('dispatching keydown to window',id)
        let win = this.windows.find(win => win.id === id)
        let msg = INPUT.MAKE_KeyboardDown({
            app:win.owner,
            window:win.id,
            keyname:keyname,
            shift:false,
        })
        await this.send(msg)
    }
}

async function start_headless_display() {
    return new HeadlessDisplay(hostname,websocket_port)
}

function log(...args) {
    console.log("TEST",...args)
}

describe('window drag test',function() {

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

            await server.shutdown()
        } catch(e) {
            console.error(e)
            await server.shutdown()
        }
    })

    it('uses the menu', async function() {
        let server = await start_message_server()

        let display = await start_headless_display()
        await display.wait_for_message(GENERAL.TYPE_Connected)
        await display.send(GENERAL.MAKE_ScreenStart())

        await server.start_app({name:'menubar', path:'src/clients/menubar.js',args:[]})
        await display.wait_for_message(DEBUG.TYPE_AppStarted)
        await display.wait_for_message(WINDOWS.TYPE_WindowOpenDisplay)
        log("menubar started")

        let app = await start_testapp(server,async (app)=>{
            app.ws.send(JSON.stringify(WINDOWS.MAKE_WindowOpen({
                x:50,
                y:50,
                width:70,
                height:80,
                sender:app.id,
                window_type:'plain'
            })))

            app.on(WINDOWS.TYPE_SetFocusedWindow,()=>{
                app.log("set focused window")
                let menu = {
                    type: "root",
                    children: [
                        {
                            type: 'top',
                            label: 'App',
                            children: [
                                {
                                    type: 'item',
                                    label: 'pause',
                                    command: 'pause'
                                },
                            ]
                        },
                    ]
                }
                app.send(MENUS.MAKE_SetMenubar({menu:menu}))
                    .then(()=>{
                        app.log("updating the menubar with ",menu)
                    })
            })
        })
        await display.wait_for_message(DEBUG.TYPE_AppStarted)
        log("test app launched")

        {
            let open_msg = await app.wait_for_message(WINDOWS.TYPE_WindowOpenResponse)
            log("open message",open_msg)
            server.send(WINDOWS.MAKE_SetFocusedWindow({window: open_msg.window}))
            await app.wait_for_message(WINDOWS.TYPE_SetFocusedWindow)
            log("app is now the focused window")
        }

        await sleep(100)
        //send menubar input
        {
            await display.dispatch_mousedown({x:5,y:5})
            await sleep(100)
            await display.dispatch_mouseup({x:5,y:5})
            await display.wait_for_message(WINDOWS.TYPE_create_child_window_display)
            log("child window opened")
        }

        //now click on the menubar item
        {
            await display.dispatch_mousedown({x:5,y:25})
            await display.dispatch_mouseup({x:5,y:25})
            await app.wait_for_message(INPUT.TYPE_Action)
            log("action sent to app")
        }

        //start menubar
        await server.shutdown()
    })
})


describe("textboxes",function() {

    it("sends keyboard events",async function () {
        let server = await start_message_server()
        let display = await start_headless_display()
        await display.wait_for_message(GENERAL.TYPE_Connected)
        await display.send(GENERAL.MAKE_ScreenStart())
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
        //wait for the app to receive it's open window
        let open_msg = await app.wait_for_message(WINDOWS.TYPE_WindowOpenResponse)
        await display.dispatch_keydown_to_window(open_msg.window,"ENTER")
        let msg = await app.wait_for_message(INPUT.TYPE_KeyboardDown)
        assert.deepStrictEqual(msg,{
            type:INPUT.TYPE_KeyboardDown,
            keyname:"ENTER",shift:false,app:app.id,window:open_msg.window}
        )
        await server.shutdown()
    })

    // it("types text",async function() {
    //     let server = await start_message_server()
    //     let display = await start_headless_display()
    //     await display.wait_for_message(GENERAL.TYPE_Connected)
    //     await display.send(GENERAL.MAKE_ScreenStart())
    //     let app = await start_testguiapp(server,async (app)=> {
    //         console.log("inside the app",app)
    //     })
    //     let open_msg = await app.wait_for_message(WINDOWS.TYPE_WindowOpenResponse)
    // })
})

