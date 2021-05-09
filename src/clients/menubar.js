import {App, Button, Component, Container, HBox, Insets, Label, VBox} from './guitoolkit.js'
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

class MenuItem extends Component {
    constructor(opts) {
        super(opts);
        this.text = opts.text || "button"
        this.item = opts.item
        this.pressed = false
        this.action = opts.action
        this.padding = new Insets(3)
        this.win = opts.win
    }
    layout(gfx) {
        let met = gfx.text_size(this.text)
        this.width = this.padding.left + met.width + this.padding.right
        this.height = this.padding.top + met.height + this.padding.bottom
    }
    input(e) {
        if(e.type === INPUT.TYPE_MouseDown) {
            this.pressed = true
            this.repaint()
        }
        if(e.type === INPUT.TYPE_MouseUp && this.pressed === true) {
            this.pressed = false
            this.repaint()
            try {
                if (this.action) this.action()
            } catch (e)  {
                console.error(e)
            }
        }
    }

    redraw(gfx) {
        let bg = "white"
        if(this.pressed)  bg = "red"
        gfx.rect(this.x, this.y, this.width, this.height, bg)
        gfx.text(this.padding.left + this.x, this.y, this.text, "black")
    }
}

class CustomMenuBar extends HBox {
    constructor(opts,tree,app,win) {
        super(opts)
        this.tree = tree
        this.app = app
        this.win = win
        this.padding = 1
        app.on(MENUS.TYPE_SetMenubar,(msg)=>{
            this.tree = msg.payload.menu
            this.children = this.tree.children.map((item,i) => {
                return new MenuItem({text:item.label, item:item, win:win, action:function() {
                    let win = this.window()
                    let pos = this.position_in_window()
                    let x = win.x + pos.x
                    let y = win.y + pos.y + this.bounds().height
                    win.a_open_child_window(x,y,40,80,'menu').then(popup => {
                        this.popup = popup
                        this.popup.root = new CustomMenu(
                            {width:popup.width, height:popup.height},
                            item,app,popup)
                        this.popup.root.parent = this.popup
                        this.popup.repaint()
                    })
                }})
            })
            this.children.forEach(ch => ch.parent = this)
            this.repaint()
        })
    }

    redraw(gfx) {
        gfx.rect(this.x,this.y,this.width,this.height,'black')
        super.redraw(gfx)
    }
}

class CustomMenu extends VBox {
    constructor(opts,item,app,win) {
        super(opts);
        this.item = item
        this.app = app
        this.win = win
        this.children = this.item.children.map((item,i) => {
            return new MenuItem({text:item.label, item:item, win:win, action:()=>{
                win.close()
                app.send(INPUT.MAKE_Action({command:item.command}))
            }})
        })
        this.children.forEach(ch => ch.parent = this)
        this.padding = 1
    }
}

async function init() {
    await app.a_init()
    let win = await app.open_window(0,0,1024/4,20,'menubar')
    win.root = new CustomMenuBar({width:win.width, height:win.height},menu_tree,app,win)
    win.redraw()
}




app.on('start',()=>init())
