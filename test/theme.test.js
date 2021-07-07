import {CentralServer, load_applist, load_uitheme} from '../src/server/server.ts'
import {message_compare, start_testguiapp} from './common.js'

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

        await server.start()
        let app = await start_testguiapp(server,async (wrapper)=>{
            let main_window = await wrapper.app.open_window(0, 0, 100, 120, 'plain')
            main_window.send({
                type:"get_control_theme",//(name, style, state) style can be * state can be *"
                name:"button",
                style:"plain",
                state:"normal",
            })
        })
        let theme_msg = await app.wait_for_message("get_control_theme_response")
        console.log("got the response",theme_msg)
        message_compare({
            type:theme_msg.type,
            theme:{
                name:theme_msg.theme.name,
                "background-color":theme_msg.theme['background-color'],
                "border-color":theme_msg.theme['border-color'],
                "color":theme_msg.theme['color'],
            }
        },{
            type:"get_control_theme_response",
            theme: {
                "name":"button",
                "background-color": "aqua",
                "border-color": "black",
                "color": "black",
            }
        })
        await server.shutdown()
    })
})
