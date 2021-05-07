import {
    App,
    Button,
    HBox,
    Label,
    Panel,
    PopupButton,
    TextBox,
    ToggleButton,
    VBox
} from './guitoolkit.js'
import {WINDOWS} from 'idealos_schemas/js/windows.js'
import {MENUS} from 'idealos_schemas/js/menus.js'
import {INPUT} from 'idealos_schemas/js/input.js'
let app = new App(process.argv)

async function init() {
    await app.a_init()
    let main_window = await app.open_window(0,0,100,120,'plain')
    main_window.root = new VBox({
        width:main_window.width,
        height:main_window.height,
        children:[
            new Label({text:"abc", font:app._symbol_font}),
            new Label({text:"label"}),
            new Button({text:'button'}),
            new HBox({children:[
                    new Button({text:'button',id:'button'}),
                    new Label({text:'label',id:'button-target'}),
                ]}),
            new TextBox({text:"hi",width:50, height: 15, id:'textbox'}),
            new HBox({children:[
                    new ToggleButton({text:'A', width:15, height:15}),
                    new ToggleButton({text:'B', width:15, height:15}),
                    new PopupButton({text:"choose", items:["Alabama","Alaska","Arizona","Arkansas"]}),
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
    app.on(INPUT.TYPE_Action,(e) => {
        if(e.payload.command === 'do_a') {
            main_window.root.find({id:'button-target'}).text = "A'd"
            main_window.redraw()
        }
        if(e.payload.command === 'do_b') {
            main_window.root.find({id:'button-target'}).text = "B'd"
            main_window.redraw()
        }
        if(e.payload.command === 'do_foo') {
            main_window.root.find({id:'button-target'}).text = "food"
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
                children:[
                    {
                        type:'item',
                        label:'Do Foo',
                        command:'do_foo'
                    }
                ]
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
