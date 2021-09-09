import {CONSTRAINTS, HBox, ListView, VBox} from './toolkit/panels.js'
import {App} from './toolkit/guitoolkit.js'
import {Label, MultilineLabel, MultilineTextBox, TextBox} from './toolkit/text.js'
import {Button, CheckButton, ToggleButton} from './toolkit/buttons.js'
import {WINDOWS} from 'idealos_schemas/js/windows.js'
import {CATEGORIES} from '../server/db/schema.js'

let app = new App(process.argv)

async function init() {
    await app.a_init()
    //sidebar of users we are chatting with
    let users = new ListView({
        width:60,
        data:[],
        template_function:(item)=>new Label({text:item.props.title}),
        height: 100,
    })

    let chatlog = new ListView({
        flex:1.0,
        data:[],
        template_function:(item)=>new Label({text:item.props.contents}),
    })
    let input = new TextBox({text: "this is my text", width: 140, height: 20})


    let win = await app.open_window(50, 50, 200, 100, 'plain')
    win.root = new HBox({
        align:'stretch',
        children: [
            users,
            new VBox({
                flex:1.0,
                align:'stretch',
                children: [
                    chatlog,
                    input
                ]
            })
        ]
    })
    win.redraw()

    let user_query = {
        and: [
            {
                TYPE: CATEGORIES.CHAT.TYPES.CONVERSATION
            },
            {
                CATEGORY: CATEGORIES.CHAT.ID
            }
        ]
    }
    let resp1 = await win.send_and_wait_for_response({ type: "database-query", query: user_query })
    console.log("resopnse 1",resp1)
    users.set_data(resp1.docs)
    win.app.on("database-query-response",(t) => {
        console.log("response is",t)
        console.log(t.payload)
    })
    let conv_query = {
        and:[
            {
                TYPE:CATEGORIES.CHAT.TYPES.MESSAGE,
            },
            {
                CATEGORY:CATEGORIES.CHAT.ID,
            }
        ]
    }
    let resp = await win.send_and_wait_for_response({type:"database-query", query:conv_query})
    console.log("got the response",resp)
    chatlog.set_data(resp.docs)

}


app.on('start',()=>init())
app.on(WINDOWS.TYPE_window_close_request,(e) =>  app.a_shutdown().then(()=>console.log("finished")))
