import {CONSTRAINTS, HBox, VBox} from './toolkit/panels.js'
import {App} from './toolkit/guitoolkit.js'
import {Label, MultilineLabel, MultilineTextBox, TextBox} from './toolkit/text.js'
import {Button, CheckButton, ToggleButton} from './toolkit/buttons.js'
import {WINDOWS} from 'idealos_schemas/js/windows.js'

let app = new App(process.argv)

async function init() {
    await app.a_init()
    let win = await app.open_window(0, 0, 100,100, 'plain')

    let output = new MultilineLabel({
        width:100,
        text:'58*20= 1160',
        flex:1.0,
    })
    let input = new TextBox({
        width:100,
        text:"1+2",
    })
    input.on('action',e => {
        output.text = output.text += "\n1+2= 3"
        output.repaint()
    })
    win.root = new VBox({
        align:'stretch',
        children:[output,input]
    })
    win.redraw()
}


app.on('start',()=>init())
app.on(WINDOWS.TYPE_window_close_request,(e) => {
    app.a_shutdown().then(()=>console.log("finished"))
})
