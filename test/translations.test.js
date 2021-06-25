import {CentralServer, load_applist, load_translation} from '../src/server/server.js'
import {message_compare, start_testguiapp} from './common.js'
import {VBox} from '../src/clients/toolkit/panels.js'

describe("load translations", function() {
    it("loads the translation", async function() {
        let applist = await load_applist("test/resources/empty.applist.json")
        let base_translation = await load_translation("resources/translations/base.json")
        let lolcat_translation = await load_translation("resources/translations/lolcat.json")
        let server = new CentralServer({
            hostname:'127.0.0.1',
            websocket_port:8081,
            apps:applist,
            translations:[base_translation,lolcat_translation],
        })
        try {
            await server.start()
            let app = await start_testguiapp(server,async (wrapper)=>{
                let win = await wrapper.app.open_window(0, 0, 100, 120, 'plain')
                win.root = new VBox({})
                wrapper.app.ws.send(JSON.stringify({
                    type:"translation_get_value",//(name, style, state) style can be * state can be *"
                    key:"button.okay",
                    app:app.app._appid,
                }))
            })
            let translation_message = await app.wait_for_message("translation_get_value_response")
            // console.log("got the response",translation_message)
            message_compare(translation_message,{
                type:"translation_get_value_response",
                key:"button.okay",
                value:"okay",
                succeeded:true,
            })
            // console.log("here")
            await app.send({
                type:'translation_set_language',
                language:"lolcat"
            })
            // console.log("waiting")
            let change_msg = await app.wait_for_message('translation_language_changed')
            message_compare(change_msg,{
                type:'translation_language_changed',
                language:"lolcat",
                succeeded:true,
            })
            app.send({
                type:"translation_get_value",
                key:"button.okay",
                app:app.app._appid,
            })
            let response = await app.wait_for_message('translation_get_value_response')
            message_compare(response,{
                type:"translation_get_value_response",
                key:"button.okay",
                value:"K",
                succeeded:true,
            })

            await server.shutdown()
        } catch (e) {
            console.log(e)
            await server.shutdown()
        }

    })
})
