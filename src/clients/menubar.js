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
        this.align = opts.align || "left"
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

class ClockMenuItem extends MenuItem {
    layout(gfx) {
        let date = new Date()
        this.text = date.getHours()+":"+date.getMinutes()+":"+date.getSeconds()
        super.layout(gfx)
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
        const open_sound = () => {
            open_menu(this.sound_menu, {
                label:'sound',
                children:[
                    {
                        type:'item',
                        label:"Mute",
                        action:function() { }
                    },
                    {
                        type:'item',
                        label:"50%",
                        action:function() { }
                    },
                    {
                        type:'item',
                        label:"100%",
                        action:function() { }
                    },
                ]
            })
        }

        this.sound_menu = new MenuItem({text: String.fromCodePoint(28), win:this.win, action:open_sound, align:'right'})
        const open_wifi = () => {
            open_menu(this.wifi_menu, {
                label:'wifi',
                children:[
                    {
                        type:'item',
                        label:"Da Awesome Car Wifi",
                        action:function() {
                        }
                    },
                    {
                        type:'item',
                        label:"jhome",
                        action:function() {
                        }
                    },
                    {
                        type:'item',
                        label:"Network Settings",
                        action:function() {
                        }
                    },
                ]
            })
        }
        this.wifi_menu = new MenuItem({text: String.fromCodePoint(29), win:this.win, action:open_wifi,align:'right'})
        const open_awake = () => {
            open_menu(this.wifi_menu, {
                label:'awake',
                children:[
                    {
                        type:'item',
                        label:"5 minutes",
                        action:function() {
                        }
                    },
                    {
                        type:'item',
                        label:"10 minutes",
                        action:function() {
                        }
                    },
                    {
                        type:'item',
                        label:"30 minutes",
                        action:function() {
                        }
                    },
                    {
                        type:'item',
                        label:"infinite minutes",
                        action:function() {
                        }
                    },
                ]
            })
        }
        this.awake_menu = new MenuItem({text:String.fromCodePoint(201), win:this.win, action:open_awake,align:'right'})
        const open_clock = () => {
            console.log("opening the clock")
        }
        this.clock_menu = new ClockMenuItem({text:'12:48 PM', win:this.win, action:open_clock,align:'right'})

        this.set_tree({type:'menubar', children:[]})
        app.on(MENUS.TYPE_SetMenubar,(msg)=> this.set_tree(msg.payload.menu))
    }
    layout(gfx) {
        this.width = this.window().width
        this.height = this.window().height

        this.children.forEach(ch => ch.layout(gfx))
        let x = 0
        let x2 = this.width
        this.children.forEach(ch => {
            if(ch.align === 'left') {
                ch.x = x
                x += ch.width
            }
            if(ch.align === 'right') {
                x2 -= ch.width
                ch.x = x2
            }
        })
    }

    redraw(gfx) {
        let bd = this.lookup_theme_part('border-color',null)
        let bg = this.lookup_theme_part('background-color',null)
        gfx.rect(this.x,this.y,this.width,this.height,bd) // border
        gfx.rect(this.x,this.y,this.width,this.height-1,bg) //background
        // let co = this.lookup_theme_part('color',null)
        super.redraw(gfx)
        // gfx.text(this.width-35,2,String.fromCodePoint(28),co)
        // gfx.text(this.width-20,2,String.fromCodePoint(29),co)
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
        this.children.push(this.sound_menu)
        this.children.push(this.awake_menu)
        this.children.push(this.wifi_menu)
        this.children.push(this.clock_menu)
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
    setInterval(()=>{
        win.repaint()
    },1*1000)
}

app.on('start',()=>init())
