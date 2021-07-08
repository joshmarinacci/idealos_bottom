import {WINDOWS} from 'idealos_schemas/js/windows.js'
import {MENUS} from 'idealos_schemas/js/menus.js'
import {INPUT} from 'idealos_schemas/js/input.js'
import {App} from './toolkit/guitoolkit.js'
import {
    CONSTRAINTS,
    HBox,
    ListView,
    ScrollPanel,
    TabPanel,
    VBox
} from './toolkit/panels.js'
import {Label, MultilineLabel, MultilineTextBox, TextBox, TranslatedLabel} from './toolkit/text.js'
import {Button, PopupButton, ToggleButton} from './toolkit/buttons.js'

let app = new App(process.argv)

async function init() {
    await app.a_init()
    let main_window = await app.open_window(0,0,150,150,'plain')
    main_window.root = new VBox({
        width:main_window.width,
        height:main_window.height,
        fill_color:'magenta',
        constraint:CONSTRAINTS.FILL,
        children:[
            new TabPanel({
                tab_labels:["labels","buttons","textboxes",'scroll'],
                tab_children:[
                    new VBox({ children: [
                            new TranslatedLabel({text_key:"button.okay"}),
                            new MultilineLabel({text:"Some cool long text\nThat is super cool and\nLong and stuff"}),
                        ]
                    }),
                    new VBox({children: [
                            new Button({text_key:"button.okay"}),
                            new HBox({children:[
                                    new Button({text:'cool button',id:'button'}),
                                    new Label({text:'label',id:'button-target'}),
                                ]}),
                            new HBox({children:[
                                    new ToggleButton({text_key:"button.yes"}),
                                    new ToggleButton({text:'No', text_key:"button.hello"}),
                                ]}),
                            new PopupButton({text:"Alabama", items:["Alabama","Alaska","Arizona","Arkansas"]}),
                    ]}),
                    new VBox({ children:[
                            new HBox({
                                children:[
                                    new Label({text:"hidden", visible:false}),
                                    new TextBox({text:"hi",width:50, height: 15, id:'textbox'}),
                                ]
                            }),
                            new MultilineTextBox({text:"This is some very long text that we need to wrap",
                                width:100,
                                height:50,
                            })
                        ]}),
                    new VBox({
                        constraint:CONSTRAINTS.FILL,
                        hstretch:true,
                        children:[
                        new Label({text:"scroll panel"}),
                        new ScrollPanel({
                            width:100,
                            height:100,
                            hstretch:true,
                            children:[
                            new ListView({
                                data:["A","B","C","D","E","F","G","H","I","J","K","L","M","N","O"],
                                template_function:item=> new Label({text:item})
                            })
                        ]})
                    ]})
                ]
            }),
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
                label:'GuiTest',
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
                label:"Test",
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
    app.a_shutdown().then(()=>console.log("finished"))
})
