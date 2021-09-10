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
        id:'sidebar',
        fill_color:'green',
        width: 80,
        children:[
            new Button({text:"songs"}),
            new Button({text:"songs"}),
            new Button({text:"songs"}),
            new Button({text:"songs"}),
            new Button({text:"songs"}),
            new Button({text:"songs"}),
            new Button({text:"songs"}),
            new Button({text:"songs"}),
        ]
    })
    let toolbar = new HBox({
        fill_color:'blue',
        id:'toolbar',
        children:[
            new Button({text:"play"}),
            new Button({text:"play"}),
            new Button({text:"play"}),
            // new Label({text:"song"}),
            // new Label({text:"time"}),
        ]
    })
    let songlist = new HBox({
        id:'songlist',
        // flex:1.0,
        fill_color:'white',
        vstretch:true,
        children:[
            new Button({text:"list of songs here"})
        ]
    })
    win.root = new VBox({
        fill_color:'yellow',
        id:'outer',
        // justify:'start',
        align:'stretch',
        children:[
            // new Button({id:'no-stretch',text:"before", flex:0}),
            toolbar,
            // new Button({id:"stretching",text:"after", flex:1}),
            new HBox({
                flex:1.0,
                id:'inner',
                fill_color:'magenta',
                align:'stretch',
                children:[
                    sidebar,
                    songlist,
                ]
            })
        ]
    })
    win.redraw()
}


app.on('start',()=>init())
app.on(WINDOWS.TYPE_window_close_request,(e) =>  app.a_shutdown().then(()=>console.log("finished")))
