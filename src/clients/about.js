import {App} from './toolkit/guitoolkit.js'
import {VBox} from './toolkit/panels.js'
import {Label} from './toolkit/text.js'
import {WINDOWS} from 'idealos_schemas/js/windows.js'

let app = new App(process.argv)
async function init() {
    await app.a_init()
    let win = await app.open_window(0, 0, 100, 100, 'plain')
    win.root = new VBox({
        width: 100,
        height: 100,
        fill_color:'white',
        children:[
            new Label({text:"About Ideal OS"})
        ]
    })
    win.redraw()
}
app.on('start',()=>init())
app.on(WINDOWS.TYPE_window_close_request,(e) => {
    app.a_shutdown().then(()=>console.log("finished"))
})
