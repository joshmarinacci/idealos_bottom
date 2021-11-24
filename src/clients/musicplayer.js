import {CONSTRAINTS, HBox, ListView, VBox} from './toolkit/panels.js'
import {App} from './toolkit/guitoolkit.js'
import {Label, MultilineLabel, MultilineTextBox, TextBox} from './toolkit/text.js'
import {Button, CheckButton, ToggleButton} from './toolkit/buttons.js'
import {WINDOWS} from 'idealos_schemas/js/windows.js'
import {CATEGORIES} from '../server/db/schema.js'

let app = new App(process.argv)

async function init() {
    await app.a_init()
    let win = await app.open_window(30,50,200,200,'plain')

    //sidebar of users we are chatting with
    //sidebar
    let sidebar = new VBox({
        id:'sidebar',
        width: 80,
        align:'left',
        children:[
            new Button({text:"songs"}),
            new Button({text:"artists"}),
            new Button({text:"albums"}),
        ]
    })

    let songlist = new ListView({
        id:'songlist',
        flex:1.0,
        data:[],
        template_function:(item)=>{
            let str = item.props.name
            if(item.props.title)  str = item.props.title
            if(item.props.artist) str += " " + item.props.artist
            if(item.props.album) str += " " + item.props.album
            return new Label({text:str})
        },
    })

    async function load_songs() {
        let query = "mimetype = audio/mpeg"
        let resp = await win.send_and_wait_for_response({
            type: "find-document",
            query: query,
        })
        console.log('loaded songs',resp.results.docs)
        songlist.set_data(resp.results.docs)
    }

    async function open_editor() {
        app.log("selected index is", songlist.get_selected_index())
        let doc = songlist.get_data()[songlist.get_selected_index()]
        app.log("song is",doc)
        let dialog = await app.open_window(210, 75, 95, 140, 'plain')

        function orEmpty(value) {
            if(!value) return "empty"
            return value
        }

        let form = new VBox({
            id:'form',
            width: 100,
            align:'left',
            children:[
                new Label({text:"title"}),
                new TextBox({text:orEmpty(doc.props.title), width:90, id:"title-box"}),
                new Label({text:"artist"}),
                new TextBox({text:orEmpty(doc.props.artist), width: 90, id:"artist-box"}),
                new Label({text:"album"}),
                new TextBox({text:orEmpty(doc.props.album), width: 90, id:"album-box"}),
                new Button({text:'cancel', action:()=> dialog.close()}),
                new Button({text:'save', action:async () => {
                    let resp = await win.send_and_wait_for_response({
                        type: "update-document",
                        docid:doc._id,
                        props:{
                            title:form.find({id:'title-box'}).text,
                            artist:form.find({id:'artist-box'}).text,
                            album:form.find({id:'album-box'}).text,
                        },
                    })
                    app.log("reponse to saving",resp)
                    await load_songs()
                    dialog.close()
                }}),
            ]
        })
        dialog.root = form
        dialog.redraw()
    }

    let toolbar = new HBox({
        id:'toolbar',
        fill_color:'gray',
        gap:3,
        children:[
            new Button({text:"play"}),
            new Label({text:"song"}),
            new Label({text:"time"}),
            new Button({text:'edit',action:()=>{
                    open_editor()
                }}),
            new TextBox({text:"search", width: 30})
        ]
    })

    win.root = new VBox({
        id:'outer',
        align:'stretch',
        children:[
            toolbar,
            new HBox({
                flex:1.0,
                id:'inner',
                align:'stretch',
                children:[
                    sidebar,
                    songlist,
                ]
            })
        ]
    })
    win.redraw()


    load_songs().then(()=>console.log("done loading songs"))
}


app.on('start',()=>init())
app.on(WINDOWS.TYPE_window_close_request,(e) =>  app.a_shutdown().then(()=>console.log("finished")))
