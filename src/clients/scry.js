import {App} from './toolkit/guitoolkit.js'
import {CONSTRAINTS, ListView, VBox} from './toolkit/panels.js'
import {Button} from './toolkit/buttons.js'
import {Label, TextBox, TranslatedLabel} from './toolkit/text.js'
import {WINDOWS} from 'idealos_schemas/js/windows.js'

let app = new App(process.argv)
async function init() {
    await app.a_init()
    let results = new ListView({
        flex:1.0,
        data:[],
        template_function:(item)=>new Label({text:"item"}),
    })

    let query = new TextBox({text:"mimetype=mp3",width:50})

    let win = await app.open_window(30,50,150,200, 'plain')
    win.root = new VBox({
        id:'vbox',
        align:'center',
        children: [
            query,
            results,
        ]
    })
    query.on('action',()=>{
            console.log("doing an action")
            // let resp = await win.send_and_wait_for_response({type:"database-query", query:conv_query})
            // console.log("got the response",resp)
            // chatlog.set_data(resp.docs)

        })
    win.redraw()
}

app.on('start',()=>init())
app.on(WINDOWS.TYPE_window_close_request,(e) => {
    app.a_shutdown().then(()=>console.log("finished"))
})
