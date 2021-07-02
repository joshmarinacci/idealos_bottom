import {CentralServer, load_applist} from '../src/server/server.ts'
import {WINDOWS} from 'idealos_schemas/js/windows.js'
import assert from 'assert'
import {GENERAL} from 'idealos_schemas/js/general.js'
import {INPUT} from 'idealos_schemas/js/input.js'
import {DEBUG} from 'idealos_schemas/js/debug.js'
import {MENUS} from 'idealos_schemas/js/menus.js'
import {App} from '../src/clients/toolkit/guitoolkit.js'
import {sleep} from '../src/common.js'
import {INFO} from 'idealos_schemas/js/keyboard_map.js'
import {TextBox} from '../src/clients/toolkit/text.js'
import {
    HeadlessDisplay,
    log,
    start_headless_display,
    start_testapp,
    start_testguiapp
} from './common.js'


describe('window drag test',function() {

    it('creates a window', async function () {
        //start the server
        // let applist = await load_applist("test/resources/good.applist.json")
        let applist = {
            system:[],
            user:[]
        }
        let server = new CentralServer({
            hostname:'127.0.0.1',
            websocket_port:8081,
            apps:applist,
        })
        await server.start()
        //start the display
        let display = await new HeadlessDisplay(server.hostname, server.websocket_port)
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
            await server.send(WINDOWS.MAKE_SetFocusedWindow({window: open_msg.window}))
            await app.wait_for_message(WINDOWS.TYPE_SetFocusedWindow)
            log("app is now the focused window")
        }

        //move the window
        {
            await server.send(WINDOWS.MAKE_WindowSetPosition({
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
    })

    it('uses the menu', async function() {
        // let applist = await load_applist("test/resources/good.applist.json")
        let applist = {
            system:[],
            user:[]
        }
        let server = new CentralServer({
            hostname:'127.0.0.1',
            websocket_port:8081,
            apps:applist,
        })
        try {
            await server.start()

            let display = await new HeadlessDisplay(server.hostname, server.websocket_port)
            await display.wait_for_message(GENERAL.TYPE_Connected)
            await display.send(GENERAL.MAKE_ScreenStart())
            await server.start_app({name: 'menubar', entrypoint: 'src/clients/menubar.js', args: []})
            await display.wait_for_message(DEBUG.TYPE_AppStarted)
            await display.wait_for_message(WINDOWS.TYPE_WindowOpenDisplay)
            let app = await start_testapp(server, async (app) => {
                app.ws.send(JSON.stringify(WINDOWS.MAKE_WindowOpen({
                    x: 50,
                    y: 50,
                    width: 70,
                    height: 80,
                    sender: app.id,
                    window_type: 'plain'
                })))

                app.on(WINDOWS.TYPE_SetFocusedWindow, () => {
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
                    app.send(MENUS.MAKE_SetMenubar({menu: menu}))
                        .then(() => {
                            app.log("updating the menubar with ", menu)
                        })
                })
            })
            await display.wait_for_message(DEBUG.TYPE_AppStarted)
            log("test app launched")

            {
                let open_msg = await app.wait_for_message(WINDOWS.TYPE_WindowOpenResponse)
                log("open message", open_msg)
                server.send(WINDOWS.MAKE_SetFocusedWindow({window: open_msg.window}))
                await app.wait_for_message(WINDOWS.TYPE_SetFocusedWindow)
                log("app is now the focused window")
            }

            await sleep(100)
            //send menubar input
            {
                await display.dispatch_mousedown({x: 5, y: 5})
                await sleep(100)
                await display.dispatch_mouseup({x: 5, y: 5})
                await display.wait_for_message(WINDOWS.TYPE_create_child_window_display)
                log("child window opened")
            }

            //now click on the menubar item
            {
                await display.dispatch_mousedown({x: 5, y: 25})
                await display.dispatch_mouseup({x: 5, y: 25})
                await app.wait_for_message(INPUT.TYPE_Action)
                log("action sent to app")
            }

            //start menubar
            await server.shutdown()
        } catch (e) {
            console.log(e)
            await server.shutdown()
        }
    })
})


describe("textboxes",function() {

    it("sends keyboard events",async function () {
        let applist = {
            system:[],
            user:[]
        }
        let server = new CentralServer({
            hostname:'127.0.0.1',
            websocket_port:8081,
            apps:applist,
        })
        try {
            await server.start()
            let display = await new HeadlessDisplay(server.hostname, server.websocket_port)
            await display.wait_for_message(GENERAL.TYPE_Connected)
            await display.send(GENERAL.MAKE_ScreenStart())
            let app = await start_testapp(server, async (app) => {
                app.ws.send(JSON.stringify(WINDOWS.MAKE_WindowOpen({
                    x: 50,
                    y: 50,
                    width: 70,
                    height: 80,
                    sender: app.id,
                    window_type: 'plain'
                })))
            })
            //wait for the app to receive it's open window
            let open_msg = await app.wait_for_message(WINDOWS.TYPE_WindowOpenResponse)
            await display.dispatch_keydown_to_window(open_msg.window, INFO.KEY_NAMES.Enter, INFO.KEY_NAMES.Enter)
            let msg = await app.wait_for_message(INPUT.TYPE_KeyboardDown)
            assert.deepStrictEqual(msg, {
                    type: INPUT.TYPE_KeyboardDown,
                    code: INFO.KEY_NAMES.Enter,
                    key: INFO.KEY_NAMES.Enter,
                    shift: false,
                    app: app.id,
                    window: open_msg.window
                }
            )
            await server.shutdown()
        } catch (e) {
            console.log(e)
            await server.shutdown()
        }
    })

    it("types text",async function() {
        let applist = {
            system:[],
            user:[]
        }
        let server = new CentralServer({
            hostname:'127.0.0.1',
            websocket_port:8081,
            apps:applist,
        })
        try {
            await server.start()
            let display = await start_headless_display()
            await display.wait_for_message(GENERAL.TYPE_Connected)
            await display.send(GENERAL.MAKE_ScreenStart())
            let app = await start_testguiapp(server, async (wrapper) => {
                let main_window = await wrapper.app.open_window(0, 0, 100, 120, 'plain')
                main_window.root = new TextBox({text: "hello"})
                main_window.redraw()
            })
            //wait for the app window to fully open
            let open_msg = await app.wait_for_message(WINDOWS.TYPE_WindowOpenResponse)
            assert.strictEqual(app.app.windows[0].root.text, 'hello')
            await sleep(500)
            log("sleept")
            // assert.strictEqual(app.app.windows)
            //send a keyboard event to the focused component
            let win_move = WINDOWS.MAKE_WindowSetPosition({
                window: open_msg.window,
                app: open_msg.target,
                x: 0,
                y: 0,
            })
            display.handle(win_move)
            display.send(win_move)
            await app.wait_for_message(WINDOWS.TYPE_WindowSetPosition)

            await display.dispatch_mousedown({x: 10, y: 10})
            await app.wait_for_message(INPUT.TYPE_MouseDown)
            await display.dispatch_keydown_to_window(open_msg.window, INFO.KEY_NAMES.KeyA, "a")
            let msg = await app.wait_for_message(INPUT.TYPE_KeyboardDown)
            assert.strictEqual(app.app.windows[0].root.text, 'helloa')
            log("yay. the text box is now helloa")

            await server.shutdown()
        } catch (e) {
            console.log(e)
            await server.shutdown()
        }
    })
})

