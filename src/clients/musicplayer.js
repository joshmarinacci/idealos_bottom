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


    const song_to_string = (item) => {
        let str = item.props.name
        if(item.props.title)  str = item.props.title
        if(item.props.artist) str += " - " + item.props.artist
        if(item.props.album) str += " - " + item.props.album
        return str
    }
    const album_to_string = (item) => {
        return item
    }
    const artist_to_string = (item) => {
        return item
    }

    let sublist  = new ListView({
        id:'sublist',
        flex:1.0,
        data:[],
        preferred_width:100,
        fill_color:'green',
        template_function:(item) => item?item.toString():"missing"
    })
    let songlist = new ListView({
        id:'songlist',
        flex:1.0,
        data:[],
        fill_color:'blue',
        template_function:(item)=>{
            return new Label({text:song_to_string(item)})
        },
    })

    let mode = "songs"

    async function load_songs() {
        let resp = await win.send_and_wait_for_response({
            type: "find-document",
            query: {
                mimetype:{"$eq":"audio/mpeg"}
            },
        })
        songlist.template_function = (item) => song_to_string(item)
        songlist.set_data(resp.results.docs)
    }

    async function load_artists() {
        let resp = await win.send_and_wait_for_response({
            type: "find-document",
            query: {
                mimetype:{"$eq":"audio/mpeg"}
            },
        })
        let artists = new Set()
        resp.results.docs.forEach(doc => {
            if(doc.props.artist) artists.add(doc.props.artist)
        })
        mode = "artists"
        sublist.template_function = (item) => artist_to_string(item)
        sublist.set_data(Array.from(artists))
    }

    async function load_songs_for_artist(artist) {
        let resp = await win.send_and_wait_for_response({
            type: "find-document",
            query: {
                mimetype:{"$eq":"audio/mpeg"},
                artist:{"$eq":artist}
            },
        })
        songlist.set_data(resp.results.docs)
    }

    async function load_albums() {
        let resp = await win.send_and_wait_for_response({
            type: "find-document",
            query: {
                mimetype:{"$eq":"audio/mpeg"}
            },
        })
        let albums = new Set()
        resp.results.docs.forEach(doc => {
            if (doc.props.album) albums.add(doc.props.album)
        })
        mode = "albums"
        sublist.template_function = (item) => album_to_string(item)
        sublist.set_data(Array.from(albums))
    }

    async function load_songs_for_album(album) {
        let resp = await win.send_and_wait_for_response({
            type: "find-document",
            query: {
                mimetype:{"$eq":"audio/mpeg"},
                album:{"$eq":album}
            },
        })
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

    let sidebar = new VBox({
        id:'sidebar',
        width: 80,
        preferred_width:80,
        align:'left',
        fill_color:'yellow',
        children:[
            new Button({text:"songs", action:()=>load_songs()}),
            new Button({text:"artists", action:()=>load_artists()}),
            new Button({text:"albums", action:()=>load_albums()}),
        ]
    })

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
                fill_color:'#ff0000',
                flex:1.0,
                id:'inner',
                align:'stretch',
                children:[
                    sidebar,
                    sublist,
                    songlist,
                ]
            })
        ]
    })
    win.redraw()


    sublist.on("changed",(l)=>{
        if(mode === "artists") {
            let n = l.get_selected_index()
            if(n<0) return
            let artist = l.get_data()[n]
            console.log("selected on sublist", n,artist)
            load_songs_for_artist(artist)
        }
        if(mode === "albums") {
            let n = l.get_selected_index()
            if(n<0) return
            let album = l.get_data()[n]
            console.log("selected on sublist", n,album)
            load_songs_for_album(album)
        }
    })
    load_songs().then(()=>console.log("done loading songs"))
}


app.on('start',()=>init())
app.on(WINDOWS.TYPE_window_close_request,(e) =>  app.a_shutdown().then(()=>console.log("finished")))
