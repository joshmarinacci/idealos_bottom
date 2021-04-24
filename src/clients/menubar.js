import {CommonApp, PixelFont} from './app_utils.js'
import {App, Container} from './guitoolkit.js'
import {MENUS} from '../schemas/menus_schemas.js'
import {WINDOWS} from "../schemas/windows_schemas.js"
import {RESOURCES} from '../schemas/resources_schemas.js'
import {INPUT} from '../schemas/input_schemas.js'
let app = new App(process.argv)//,1024/4,10,'menubar')

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
    constructor(opts,tree,app,win) {
        super(opts)
        this.tree = tree
        this.app = app
        this.win = win
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
    async mouse_down_at(e) {
        this.app.log("down at",e.payload)
        let i = Math.floor(e.payload.x/20)
        if(this.tree.children.length >= i) {
            let item = this.tree.children[i]
            this.app.log("clicked on",item)
            item.open = !item.open
            this.win.redraw()
            if(item.open) {
                //request window
                this.app.log("sending create child window")
                this.popup = await this.win.a_open_child_window(i*20,10,30,40,'menu')
                // this.app.send(WINDOWS.MAKE_create_child_window({
                //     type:'CREATE_CHILD_WINDOW',
                    // parent:this.win._winid,
                    // x:i*20,y:10,
                    // width:30,height:40,
                    // style:'menu',
                    // sender:this.app._appid}))
            } else {
                //close window
                await this.popup.close()
                // this.app.log("sending close child window", this.popup_id)
                // this.app.send(WINDOWS.MAKE_close_child_window({
                //     type:'CLOSE_CHILD_WINDOW',
                    // parent:this.win._winid,
                    // id: this.popup_id,
                    // sender:this.app._appid
                // }))
            }
        }
    }
}

async function init() {
    await app.a_init()
    let win = await app.open_window(0,0,1024/4,10,'menubar')
    win.root = new CustomMenuBar({width:win.width, height:win.height},menu_tree,app,win)
    win.redraw()
        // app.send(MENUS.MAKE_create_menu_tree_message({type:'CREATE_MENU_TREE',menu:menu_tree}))

    app.on(INPUT.TYPE_MouseDown,(e)=>{
        win.root.mouse_down_at(e)
    })
        // app.on(WINDOWS.TYPE_create_child_window_response,(e)=>{
        //     app.log("got the child window response",e)
        //     app.win.root.popup_id = e.payload.window.id
        // })
        // app.on(INPUT.TYPE_MouseUp,()=>{
        // })

}




app.on('start',()=>init())