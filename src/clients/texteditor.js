import {CONSTRAINTS, VBox} from './toolkit/panels.js'
import {App} from './toolkit/guitoolkit.js'
import {MultilineTextBox} from './toolkit/text.js'
import {WINDOWS} from 'idealos_schemas/js/windows.js'

let app = new App(process.argv)

async function init() {
    await app.a_init()
    let win = await app.open_window(0, 0, 100,100, 'plain')
    win.root = new VBox({
        constraint:CONSTRAINTS.FILL,
        children: [
            new MultilineTextBox({
                text:"this is some text",
                width:100,
                height:100,
            })
        ]
    })
    win.redraw()
}


app.on('start',()=>init())
app.on(WINDOWS.TYPE_window_close_request,(e) => {
    app.a_shutdown().then(()=>console.log("finished"))
})
