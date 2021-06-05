import {CentralServer} from '../src/server/server.js'
import {GENERAL} from 'idealos_schemas/js/general.js'
import {WINDOWS} from 'idealos_schemas/js/windows.js'
import {INFO} from 'idealos_schemas/js/keyboard_map.js'
import {INPUT} from 'idealos_schemas/js/input.js'
import assert from 'assert'
import {HeadlessDisplay, start_testapp} from './common.js'

describe("keybindings",function() {

    it("sends keyboard events to actions", async function () {
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
            let display = new HeadlessDisplay(server.hostname, server.websocket_port)
            await display.wait_for_message(GENERAL.TYPE_Connected)
            await display.send(GENERAL.MAKE_ScreenStart())

            let app = await start_testapp(server, async (app) => {
                // open window
                app.ws.send(JSON.stringify(WINDOWS.MAKE_WindowOpen({
                    x: 50,
                    y: 50,
                    width: 70,
                    height: 80,
                    sender: app.id,
                    window_type: 'plain'
                })))
                //wait for keyboard action events
            })

            let open_msg = await app.wait_for_message(WINDOWS.TYPE_WindowOpenResponse)
            await display.dispatch_keydown_to_window(open_msg.window,
                INFO.KEY_NAMES.ArrowRight,
                INFO.KEY_NAMES.ArrowRight)
            let msg1 = await app.wait_for_message(INPUT.TYPE_Action)
            assert.deepStrictEqual(msg1, {
                    command:'navigate-cursor-right',
                    type: INPUT.TYPE_Action,
                }
            )
            await display.dispatch_keydown_to_window(open_msg.window,
                INFO.KEY_NAMES.KeyF,
                'F',false,true)
            let msg2 = await app.wait_for_message(INPUT.TYPE_Action)
            assert.deepStrictEqual(msg2, {
                    command:'navigate-cursor-right',
                    type: INPUT.TYPE_Action,
                }
            )
            await server.shutdown()
        } catch (e) {
            console.log(e)
            throw e
        }

    })

})
