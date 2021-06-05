import {CentralServer, load_applist, load_uitheme} from '../src/server/server.js'
import assert from 'assert'
import {start_testapp, start_testguiapp} from './common.js'

describe("load apps list", function() {
    it("loads the gui theme", async function() {
        let applist = await load_applist("test/resources/empty.applist.json")
        let uitheme = await load_uitheme("resources/uitheme.json")
        let server = new CentralServer({
            hostname:'127.0.0.1',
            websocket_port:8081,
            apps:applist,
            uitheme:uitheme,
        })
        try {
            await server.start()
            let app = await start_testguiapp(server,async (wrapper)=>{
                console.log("in the app",app)
                let main_window = await wrapper.app.open_window(0, 0, 100, 120, 'plain')
                wrapper.app.ws.send(JSON.stringify({
                    type:"get_control_theme",//(name, style, state) style can be * state can be *"
                    name:"button",
                    style:"plain",
                    state:"normal",
                    app:app.app._appid
                }))
            })
            let theme_msg = await app.wait_for_message("get_control_theme_response")
            console.log("got the response",theme_msg)
            await server.shutdown()
        } catch (e) {
            console.log(e)
            await server.shutdown()
        }
    })
})
