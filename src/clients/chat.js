import {CONSTRAINTS, HBox, VBox} from './toolkit/panels.js'
import {App} from './toolkit/guitoolkit.js'
import {Label, MultilineLabel, MultilineTextBox, TextBox} from './toolkit/text.js'
import {Button, CheckButton, ToggleButton} from './toolkit/buttons.js'
import {WINDOWS} from 'idealos_schemas/js/windows.js'

let app = new App(process.argv)

async function init() {
    await app.a_init()
    //sidebar of users we are chatting with
    let users = new VBox({
        width:60,
        children:[
            new Button({text:"Alice"}),
            new Button({text:"Bob"}),
            new Button({text:"Claire"}),
        ],
        height:100,
    })

    //main chat view

    let chatlog = new VBox({
        width: 140,
        height: 100,
        children:[
            new Button({text:"Hi Bob"}),
            new Button({text:"Hi Alice"}),
            new Button({text:"What's for dinner?"}),
            new Button({text:"Mac and Cheese"}),
        ]
    })
    let input = new TextBox({text:"this is my text", width: 140, height: 20})


    let win = await app.open_window(0, 0, 200,100, 'plain')
    win.root = new HBox({
        children:[
            users,
            new VBox({
                width:140,
                height:100,
                children:[
                chatlog,
                input
            ]})
        ]
    })
    win.redraw()
}


app.on('start',()=>init())
app.on(WINDOWS.TYPE_window_close_request,(e) =>  app.a_shutdown().then(()=>console.log("finished")))
