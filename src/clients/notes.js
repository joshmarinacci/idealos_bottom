import {App} from './toolkit/guitoolkit.js'
import {CONSTRAINTS, HBox, ListView, VBox} from './toolkit/panels.js'
import {Label, MultilineTextBox, TextBox} from './toolkit/text.js'
import {Button} from './toolkit/buttons.js'
import {CATEGORIES} from '../server/db/schema.js'
import {WINDOWS} from 'idealos_schemas/js/windows.js'
import {MENUS} from 'idealos_schemas/js/menus.js'
import {INPUT} from 'idealos_schemas/js/input.js'
import {AND, IS_CATEGORY, IS_PROP_SUBSTRING, IS_TYPE} from '../server/db/query.js'

let app = new App(process.argv)
async function init() {
    await app.a_init()

    let win = await app.open_window(0, 0, 150,100, 'plain')
    let save = new Button({text:'save'})
    let add_note = new Button({text:'add'})
    let query_box = new TextBox({width:50, text:"search"})
    let toolbar = new HBox({
        vstretch:true,
        fill_color:'red',
        children:[ query_box, add_note, save, ]})
    let list = new ListView({
        width:50,
        data:[],
        template_function:(item)=>{
            return new Label({text:item.props.title})
        },
    })
    let title = new TextBox({text:"title", height:15})
    let editor = new MultilineTextBox({flex:1.0, width: 100, text:""})

    list.on('changed',() => {
        if(list.selected_index >= 0) {
            let note = list.data[list.selected_index]
            title.set_text(note.props.title)
            editor.set_text(note.props.body)
        } else {
            title.set_text('')
            title.set_text('')
        }
    })



    win.root = new VBox({
        constraint:CONSTRAINTS.FILL,
        hstretch:true,
        children:[
            toolbar,
            new HBox({
                flex:1.0,
                height:60,
                width: 150,
                vstretch:true,
                children:[list, new VBox({
                    constraint:CONSTRAINTS.FILL,
                    hstretch:true,
                    flex:1,
                    children:[title,editor]
                })],
            })
        ]
    })
    win.redraw()
    // console.log(JSON.stringify(win.root.dump(),null, '  '))

    const query = AND(
        IS_TYPE(CATEGORIES.NOTE.TYPES.NOTE),
        IS_CATEGORY(CATEGORIES.NOTE.ID)
    )
    win.app.on("database-watch-update",t => {
        console.log("===========\ngot database update",t)
        win.send({
            type:"database-query",
            query: query
        })
    })
    win.app.on("database-query-response",(t) => {
        let notes = t.payload.docs
        console.log("got database result",notes)
        list.set_data(notes)
    })
    const category =  CATEGORIES.NOTE.ID

    win.send({
        type:"database-watch",
        category:category,
    })
    win.send({
        type:"database-query",
        query: query
    })

    const do_save_note = () => {
        if(list.selected_index >= 0) {
            let note = list.data[list.selected_index]
            let msg = {
                type:"database-update",
                object:{
                    id:note.id,
                    props:{
                        "title":title.text,
                        "body":editor.tl.text
                    },
                }
            }
            win.log("sending message",msg)
            win.send(msg)
        }
    }
    save.on('action',do_save_note)
    title.on('action',do_save_note)

    const do_add_note = () => {
        let new_note = {
            category: CATEGORIES.NOTE.ID,
            type: CATEGORIES.NOTE.TYPES.NOTE,
            props: {
                title: "unnamed",
                body: "no text",
            }
        }
        win.send({
            type:"database-add",
            object:new_note
        })
    }
    add_note.on('action',do_add_note)

    query_box.on("change",() => {
        let str = query_box.text.trim()
        let q = null
        if(str.length === 0) {
            q = AND(
                IS_TYPE(CATEGORIES.NOTE.TYPES.NOTE),
                IS_CATEGORY(CATEGORIES.NOTE.ID)
                )
        } else {
            q = AND(
                IS_TYPE(CATEGORIES.NOTE.TYPES.NOTE),
                IS_CATEGORY(CATEGORIES.NOTE.ID),
                IS_PROP_SUBSTRING("title",str),
            )
        }
        win.send({type: "database-query",query: q})
    })


    app.on(WINDOWS.TYPE_SetFocusedWindow,()=>{
        let menu = {
            type:"root",
            children:[
                {
                    type:'top',
                    label:'File',
                    children:[
                        {
                            type:'item',
                            label:'New Note',
                            command:'new_note'
                        },
                        {
                            type:'item',
                            label:'Save',
                            command:'save_note'
                        }
                    ]
                },
            ]
        }
        let msg =  MENUS.MAKE_SetMenubar({menu:menu})
        app.send(msg)
    })

    app.on(INPUT.TYPE_Action,(e) => {
        if (e.payload.command === 'save_note') do_save_note()
        if (e.payload.command === 'new_note') do_add_note()
    })

}
app.on('start',()=>init())
app.on(WINDOWS.TYPE_window_close_request,(e) => {
    app.a_shutdown().then(()=>console.log("finished"))
})
