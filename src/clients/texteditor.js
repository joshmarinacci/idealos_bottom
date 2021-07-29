import {CONSTRAINTS, HBox, VBox} from './toolkit/panels.js'
import {App, JoshFont} from './toolkit/guitoolkit.js'
import {MultilineTextBox} from './toolkit/text.js'
import {WINDOWS} from 'idealos_schemas/js/windows.js'
import {Button} from './toolkit/buttons.js'
import {SYSTEM} from './apis.js'

let app = new App(process.argv)

async function init() {
    await app.a_init()
    let emoji_font = null
    let win = await app.open_window(0, 0, 100,100, 'plain')
    let font = await SYSTEM.request_font(win,'emoji')
    emoji_font = new JoshFont(font)
    win.root = new VBox({
        constraint:CONSTRAINTS.FILL,
        children: [
            new HBox({
                children:[new Button({
                    text:"\u{1F600}",
                    font:emoji_font,
                    action:() => {
                        let tb = win.root.find({id:'texto'})
                        tb.tl.insert_char_at_cursor('\u{1F600}')
                        tb.repaint()
                    }
                })],
            }),
            new MultilineTextBox({
                id:"texto",
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
