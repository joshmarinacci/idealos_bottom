import {CONSTRAINTS, HBox, ListView, VBox} from './toolkit/panels.js'
import {App} from './toolkit/guitoolkit.js'
import {Label, MultilineLabel, MultilineTextBox, TextBox} from './toolkit/text.js'
import {Button, CheckButton, ToggleButton} from './toolkit/buttons.js'
import {WINDOWS} from 'idealos_schemas/js/windows.js'
import {CATEGORIES} from '../server/db/schema.js'

let app = new App(process.argv)

async function init() {
    await app.a_init()
    let win = await app.open_window(30,50,200,150,'plain')

    //sidebar of users we are chatting with
    //sidebar
    let sidebar = new VBox({
        fill_color:'green',
        flex:1.0,
        width: 100,
        children:[
            new Button({text:"songs"})
        ]
    })
    let toolbar = new HBox({
        children:[
            new Button({text:"play"}),
            new Label({text:"song"}),
            new Label({text:"time"}),
        ]
    })
    let songlist = new HBox({
        flex:1.0,
        fill_color:'green',
        vstretch:true,
        children:[
            new Button({text:"list of songs here"})
        ]
    })
    win.root = new VBox({
        constraint:CONSTRAINTS.FILL,
        hstretch:true,
        fill_color:'yellow',
        children:[toolbar,
            new HBox({
                flex:1.0,
                height:60,
                width:150,
                vstretch:true,
                fill_color:'magenta',
                children:[sidebar, new VBox({
                        constraint:CONSTRAINTS.FILL,
                        hstretch:true,
                        flex:1,
                        children:[new Label({text:"foo"}),songlist],
                    })
                ]
            })
        ]
    })
    win.redraw()
}


app.on('start',()=>init())
app.on(WINDOWS.TYPE_window_close_request,(e) =>  app.a_shutdown().then(()=>console.log("finished")))
