import {App, Button, HBox, Label, Panel, TextBox, ToggleButton, VBox} from './guitoolkit.js'
import {WINDOWS} from 'idealos_schemas/js/windows.js'
import {MENUS} from 'idealos_schemas/js/menus.js'
let app = new App(process.argv)

async function init() {
    await app.a_init()
    app.log("done initting. opening window")
    let main_window = await app.open_window(0,0,100,100,'plain')
    main_window.root = new VBox({
        width:main_window.width,
        height:main_window.height,
        children:[
            new Label({text:"label 1"}),
            new Label({text:"label 2"}),
            new Label({text:"label 3"}),
            new Button({text:'button',width:30, height:15}),
            new HBox({children:[
                    new Button({text:'button',width:30, height:15, id:'button'}),
                    new Label({text:'label',id:'button-target'}),
                ]}),
            new TextBox({text:"hi",width:50, height: 15, id:'textbox'}),
            new HBox({children:[
                    new ToggleButton({text:'A', width:15, height:15}),
                    new ToggleButton({text:'B', width:15, height:15}),
                ]})
        ]})

    //attach actions
    main_window.root.find({id:'button'}).on('action',()=>{
        main_window.root.find({id:'button-target'}).text = 'clicked!'
        main_window.redraw()
    })
    main_window.root.find({id:'textbox'}).on('action',()=>{
        main_window.root.find({id:'button-target'}).text = 'committed'
        main_window.redraw()
    })
    main_window.redraw()
    app.on("ACTION",(e) => {
        console.log("got the action",e)
        if(e.payload.command === 'do_a') {
            main_window.root.find({id:'button-target'}).text = "A'd"
            main_window.redraw()
        }
        if(e.payload.command === 'do_b') {
            main_window.root.find({id:'button-target'}).text = "B'd"
            main_window.redraw()
        }
    })
}




app.on('start',()=>init())
app.on(WINDOWS.TYPE_SetFocusedWindow,()=>{
    console.log("gui app received the focus")
    let menu = {
        type:"root",
        children:[
            {
                type:'top',
                label:'Hi',
                children:[
                    {
                        type:'item',
                        label:'Do A',
                        command:'do_a'
                    },
                    {
                        type:'item',
                        label:'Do B',
                        command:'do_b'
                    }
                ]
            },
            {
                type:'top',
                label:"There",
                children:[]
            }
        ]
    }
    let msg =  MENUS.MAKE_SetMenubar({menu:menu})
    app.send(msg)
    console.log("sent the message",msg)
})

app.on(WINDOWS.TYPE_window_close_request,(e) => {
    console.log("got a close on window",e)
    app.a_shutdown().then("finished")
})
