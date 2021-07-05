import {App} from './toolkit/guitoolkit.js'
import {CONSTRAINTS, HBox, ListView, VBox} from './toolkit/panels.js'
import {Label, MultilineTextBox, TextBox} from './toolkit/text.js'
import {Button} from './toolkit/buttons.js'

let app = new App(process.argv)
async function init() {
    await app.a_init()

    let win = await app.open_window(0, 0, 150,100, 'plain')
    let toolbar = new HBox({
        vstretch:true,
        fill_color:'red',
        children:[
            new TextBox({
                width:50,
                text:"query"
            }),
            new Button({
                text:'add'
            }),
            new Button({
                text:'archive'
            })
        ]})
    let list = new ListView({
        width:50,
        data:["1","2","3"],
        template_function:(item)=>{
            return new Label({text:'an item'})
    }})
    let editor = new MultilineTextBox({flex:1.0, width: 100, text:"your notes"})



    win.root = new VBox({
        constraint:CONSTRAINTS.FILL,
        hstretch:true,
        children:[
            toolbar,
            new HBox({
                flex:1.0,
                fill_color:'cyan',
                height:60,
                width: 150,
                vstretch:true,
                children:[list,editor,]
            })
        ]
    })
    win.redraw()
    console.log(JSON.stringify(win.root.dump(),null, '  '))
}
app.on('start',()=>init())
