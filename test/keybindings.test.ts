import {CentralServer} from '../src/server/server.js'
import {GENERAL} from 'idealos_schemas/js/general.js'
import {WINDOWS} from 'idealos_schemas/js/windows.js'
import {INFO} from 'idealos_schemas/js/keyboard_map.js'
import {INPUT} from 'idealos_schemas/js/input.js'
import {HeadlessDisplay, message_compare, start_testguiapp} from './common.js'
import {TextBox} from '../src/clients/toolkit/text.js'

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

            await server.start()
            let display = new HeadlessDisplay(server.hostname, server.websocket_port)
            await display.wait_for_message(GENERAL.TYPE_Connected)
            await display.send(GENERAL.MAKE_ScreenStart())

            let app = await start_testguiapp(server, async (wrapper) => {
                let win = await wrapper.app.open_window(50,50,70,80,'plain')
                win.root = new TextBox({ text:"hi" })
                win.redraw()
            })

            let open_msg:any = await app.wait_for_message(WINDOWS.TYPE_WindowOpenResponse)
            await display.dispatch_mousedown({x:65,y:65})
            await display.dispatch_keydown_to_window(open_msg.window,
                INFO.KEY_NAMES.ArrowRight,
                INFO.KEY_NAMES.ArrowRight)
            let msg1 = await app.wait_for_message(INPUT.TYPE_Action)
            message_compare(msg1, {
                    command:'navigate-cursor-right',
                    type: INPUT.TYPE_Action,
                    window:open_msg.window,
                    app:app.app._appid,
                }
            )
            await display.dispatch_keydown_to_window(open_msg.window,
                INFO.KEY_NAMES.KeyF,
                'F',false,true)
            let msg2 = await app.wait_for_message(INPUT.TYPE_Action)
            message_compare(msg2, {
                    command:'navigate-cursor-right',
                    type: INPUT.TYPE_Action,
                    window:open_msg.window,
                    app:app.app._appid,
                }
            )
            await server.shutdown()

    })

})
