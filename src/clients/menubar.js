import {App, Container} from './guitoolkit.js'
import {MENUS} from 'idealos_schemas/js/menus.js'
import {INPUT} from 'idealos_schemas/js/input.js'
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
        app.on(MENUS.TYPE_SetMenubar,(msg)=>{
            this.tree = msg.payload.menu
            this.win.redraw()
        })
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
    input(m,k,w) {
        let i = Math.floor(m.x/20)
        if(this.tree.children.length > i) {
            let item = this.tree.children[i]
            item.open = !item.open
            this.win.redraw()
            if(item.open) {
                let width = 30
                let height = item.children.length*20
                this.win.a_open_child_window(i*20,20,width,height,'menu').then(popup => {
                    this.popup = popup
                    this.popup.root = new CustomMenu({width, height},item,app,this.popup)
                    this.popup.redraw()
                })
            } else {
                if(this.popup)  this.popup.close()
            }
        }
    }
}
class CustomMenu extends Container {
    constructor(opts,item,app,win) {
        super(opts);
        this.item = item
        this.app = app
        this.win = win
    }
    redraw(gfx) {
        gfx.rect(this.x, this.y, this.width, this.height, 'black')
        gfx.rect(this.x+1, this.y+1, this.width-2, this.height-2, 'red')
        this.item.children.forEach((top, i) => {
            let bg = 'white'
            let fg = 'black'
            if(top.active) {
                bg = 'black'
                fg = 'white'
            }
            gfx.rect(2, i * 15+2, 20, 10, bg)
            gfx.text(2, i * 15 + 4, top.label, fg)
        })
    }
    input(m,k,w) {
        let j = Math.floor(m.y/15)
        if(this.item.children.length > j) {
            let sub = this.item.children[j]
            sub.active = !sub.active
            this.win.close()
            this.win.redraw()
            this.app.send({
                type:'ACTION',
                command:sub.command
            })
        }
    }
}

async function init() {
    await app.a_init()
    let win = await app.open_window(0,0,1024/4,10,'menubar')
    win.root = new CustomMenuBar({width:win.width, height:win.height},menu_tree,app,win)
    win.redraw()
}




app.on('start',()=>init())
