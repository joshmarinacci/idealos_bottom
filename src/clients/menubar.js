import {make_message, SCHEMAS} from '../canvas/messages.js'
import {CommonApp, PixelFont} from './app_utils.js'
import {Container} from './guitoolkit.js'
import {MENUS} from '../schemas/menus_schemas.js'
import {WINDOWS} from "../schemas/windows_schemas.js"
let app = new CommonApp(process.argv,1024/4,10,'menubar')

let menu_tree = MENUS.MAKE_root({
    type:'root',
    children:[
        {
            type:'top',
            label:'File',
            children:[
                {
                    type:'item',
                    label:'Open',
                    event:'open_file',
                    keystroke:{
                        modifier:'meta',
                        key:'O',
                    }
                },
                {
                    type:'item',
                    label:'Close',
                    event:'close_window',
                    keystroke: {
                        modifier: 'meta',
                        key:'W',
                    }
                }
            ]
        },
        {
            type:'top',
            label:'Edit',
            children:[
                {
                    type:'item',
                    label:'Cut',
                    event:'clipboard_cut',
                    keystroke: {
                        modifier: 'meta',
                        key:'X'
                    }
                },
                {
                    type:'item',
                    label:'Copy',
                    event:'clipboard_copy',
                    keystroke: {
                        modifier: 'meta',
                        key:'C'
                    }
                },
                {
                    type:'item',
                    label:'Paste',
                    event:'clipboard_paste',
                    keystroke: {
                        modifier: 'meta',
                        key:'V'
                    }
                },
            ]
        }
    ]
})

class CustomMenuBar extends Container {
    constructor(opts,tree) {
        super(opts)
        this.tree = tree
    }
    redraw(gfx) {
        gfx.rect(this.x,this.y,this.width,this.height,'white')
        // gfx.text(this.x,this.y,'cool menu bar','black')
        this.tree.children.forEach((top,i) => {
            let bg = 'white'
            let fg = 'black'
            if(top.open) {
                bg = 'black'
                fg = 'white'
            }
            gfx.rect(this.x + i * 20, this.y, 20, 10, bg)
            gfx.text(this.x + i * 20 + 2, this.y, top.label, fg)
        })
    }
    mouse_down_at(e) {
        app.log("down at",e.payload)
        let i = Math.floor(e.payload.x/20)
        if(this.tree.children.length >= i) {
            let item = this.tree.children[i]
            app.log("clicked on",item)
            item.open = !item.open
            app.win.redraw()
            if(item.open) {
                //request window
                app.log("sending create child window")
                app.send(WINDOWS.MAKE_create_child_window({
                    // type:'CREATE_CHILD_WINDOW',
                    parent:app.win_id,
                    x:i*20,y:10,
                    width:30,height:40,
                    style:'menu',
                    sender:app.appid}))
            } else {
                //close window
                app.log("sending close child window", this.popup_id)
                app.send(WINDOWS.MAKE_close_child_window({
                    // type:'CLOSE_CHILD_WINDOW',
                    parent:app.win_id,
                    id: this.popup_id,
                    sender:app.appid
                }))
            }
        }
    }
}

async function init() {
    try {
        //load font
        app.font = await PixelFont.load("src/clients/fonts/font.png", "src/clients/fonts/font.metrics.json")
        //create gui components
        app.win.root = new CustomMenuBar({width:app.win.width, height:app.win.height},menu_tree)
        app.win.redraw()
        //get the latest version of the theme
        app.send(make_message(SCHEMAS.RESOURCE.GET,{'resource':'theme','sender':app.appid}))
        // app.send(MENUS.MAKE_create_menu_tree_message({type:'CREATE_MENU_TREE',menu:menu_tree}))

        app.on(SCHEMAS.MOUSE.DOWN.NAME,(e)=>{
            app.win.root.mouse_down_at(e)
        })
        app.on(WINDOWS.MAKE_create_child_window_response_name,(e)=>{
            app.log("got the child window response",e)
            app.win.root.popup_id = e.payload.window.id
        })
        app.on(SCHEMAS.MOUSE.UP.NAME,()=>{
        })
        app.on(WINDOWS.MAKE_window_refresh_request_name, ()=>{
        })

    } catch (e) {
        app.log(e)
    }
}




app.on('start',()=>init())