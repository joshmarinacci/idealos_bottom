import {MENUS} from 'idealos_schemas/js/menus.js'
import {INPUT} from 'idealos_schemas/js/input.js'
import {App, Component, Container, Insets} from './toolkit/guitoolkit.js'
import {CONSTRAINTS, HBox, VBox} from './toolkit/panels.js'
import {Button} from './toolkit/buttons.js'
import {SYSTEM} from './apis.js'
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
        this.name = "menu-item"
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
        let state = this.pressed?"pressed":null
        let bg = this.lookup_theme_part('background-color',state)
        let txt = this.lookup_theme_part('color',state)
        gfx.rect(this.x, this.y, this.width, this.height, bg)
        gfx.text(this.padding.left + this.x, this.y+this.padding.top, this.text, txt)
    }
}

function open_menu(mi,item) {
    let win = mi.window()
    let pos = mi.position_in_window()
    let x = win.x + pos.x
    let y = win.y + pos.y + mi.bounds().height
    win.a_open_child_window(x,y,40,80,'menu').then(popup => {
        mi.popup = popup
        mi.popup.root = new CustomMenu(
            {width:popup.width, height:popup.height},
            item,app,popup)
        mi.popup.root.parent = mi.popup
        mi.popup.shrink_to_fit()
    })
}

class CustomMenuBar extends Container {
    constructor(opts,tree,app,win) {
        super(opts)
        this.name = "menu-bar"
        this.tree = tree
        this.app = app
        this.win = win
        this.padding = 1
        this.system_menu = new MenuItem({text:'~',win:this.win, action:() => {
            open_menu(this.system_menu, {
                label:'system',
                children:[
                    {
                        type:'item',
                        label:"About",
                        action:function() {
                            SYSTEM.start_app_by_name(app,"about")
                        }
                    },
                ]
            })
        }})
        this.set_tree({type:'menubar', children:[]})
        app.on(MENUS.TYPE_SetMenubar,(msg)=> this.set_tree(msg.payload.menu))
    }
    layout(gfx) {
        console.log("menubar layout",this.window().width)
        this.width = this.window().width
        this.height = this.window().height

        this.children.forEach(ch => ch.layout(gfx))
        let x = 0
        this.children.forEach(ch => {
            ch.x = x
            x += ch.width
        })
    }

    redraw(gfx) {
        let bd = this.lookup_theme_part('border-color',null)
        let bg = this.lookup_theme_part('background-color',null)
        gfx.rect(this.x,this.y,this.width,this.height,bd) // border
        gfx.rect(this.x,this.y,this.width,this.height-1,bg) //background
        let co = this.lookup_theme_part('color',null)
        super.redraw(gfx)
        gfx.text(this.width-35,2,String.fromCodePoint(28),co)
        gfx.text(this.width-20,2,String.fromCodePoint(29),co)
    }

    set_tree(menu) {
        this.tree = menu
        this.children = this.tree.children.map((item,i) => {
            let mi = new MenuItem({text:item.label, item:item, win:this.win, action:() => {
                    open_menu(mi, item)
                }})
            return mi
        })
        this.children.unshift(this.system_menu)
        this.children.forEach(ch => ch.parent = this)
        this.repaint()
    }
}

class CustomMenu extends VBox {
    constructor(opts,item,app,win) {
        super(opts);
        this.item = item
        this.app = app
        this.win = win
        this.constraint = CONSTRAINTS.WRAP
        this.hstretch = true
        this.fill_color = 'black'
        this.children = this.item.children.map((item,i) => {
            return new MenuItem({text:item.label, item:item, win:win, action:()=>{
                win.close()
                if(typeof item.action === 'function') {
                    item.action()
                } else {
                    app.send(INPUT.MAKE_Action({
                        command: item.command,
                        app: this.app._appid,
                        window: this.win._winid
                    }))
                }
            }})
        })
        this.children.forEach(ch => ch.parent = this)
        this.padding = 1
    }
}

async function init() {
    await app.a_init()
    let win = await app.open_window(0,0,512,17,'menubar')
    win.root = new CustomMenuBar({width:win.width, height:win.height},menu_tree,app,win)
    win.redraw()
}




app.on('start',()=>init())
