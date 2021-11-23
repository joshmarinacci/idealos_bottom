import {App} from './toolkit/guitoolkit.js'
import {ListView, VBox} from './toolkit/panels.js'
import {Label, TextBox} from './toolkit/text.js'
import {WINDOWS} from 'idealos_schemas/js/windows.js'

let app = new App(process.argv)
async function init() {
    await app.a_init()
    let results = new ListView({
        flex:1.0,
        data:[],
        template_function:(item)=>new Label({text:item.props.name + " " + item.props.mimetype}),
    })

    let query = new TextBox({text:"mimetype = audio/mpeg",width:100})

    let win = await app.open_window(30,50,150,200, 'plain')
    win.root = new VBox({
        id:'vbox',
        align:'stretch',
        justify:'center',
        children: [
            query,
            results,
        ]
    })
    query.on('action',async () => {
        let resp = await win.send_and_wait_for_response({
            type: "find-document",
            query: query.text,
        })
        console.log(resp.results.docs)
        results.set_data(resp.results.docs)
    })
    win.redraw()
}

app.on('start',()=>init())
app.on(WINDOWS.TYPE_window_close_request,(e) => {
    app.a_shutdown().then(()=>console.log("finished"))
})
