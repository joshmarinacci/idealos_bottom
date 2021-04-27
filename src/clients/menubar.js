import {App, Button, Component, Container, Insets, Label} from './guitoolkit.js'
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
        this.active = false
        this.action = opts.action
        this.padding = new Insets(5)
        this.win = opts.win
    }
    layout(gfx) {
        let met = gfx.text_size(this.text)
        this.width = this.padding.left + met.width + this.padding.right
    }
    input(mouse, keyboard,w) {
        if(!mouse.inside(this.x,this.y,this.width,this.height)) {
            this.active = false
            return false
        } else {
            this.active = true
        }
        if(mouse.down) {
            if(!this.pressed) {
                console.log('transition to pressed, trigger the event')
                this.do_action()
            }
            this.pressed = true
        } else {
            // this.pressed = false
        }
        return true
    }

    redraw(gfx) {
        let bg = "blue"
        if (this.pressed)  bg = "green"
        if(this.active)    bg = "yellow"
        if(this.pressed && this.active) bg = "orange"
        gfx.rect(this.x, this.y, this.width, this.height, bg)
        gfx.text(this.padding.left + this.x, this.y, this.text, "black")
    }

    do_action() {
        if(this.action)this.action()
        // this.item.open = !this.item.open
        // if(this.item.open) {
        //     this.win.a_open_child_window(this.x*20,20,40,80,'menu').then(popup => {
        //         console.log("got the popup window")
        //         this.popup = popup
        //         this.popup.root = new CustomMenu({width:popup.width, height:popup.height},this.item,app,this.popup)
        //         this.popup.redraw()
        //     })
        // }
    }
}
class CustomMenuBar extends Container {
    constructor(opts,tree,app,win) {
        super(opts)
        this.tree = tree
        this.app = app
        this.win = win
        app.on(MENUS.TYPE_SetMenubar,(msg)=>{
            this.tree = msg.payload.menu
            this.children = this.tree.children.map((item,i) => {
                return new MenuItem({text:item.label, x:i*30, width:30, y:1, height:this.height-2, item:item, win:win, action:()=>{
                        win.a_open_child_window(this.x*20+10,20+10,40,80,'menu').then(popup => {
                            this.popup = popup
                            this.popup.root = new CustomMenu({width:popup.width, height:popup.height},item,app,popup)
                            this.popup.redraw()
                        })
                    }})
            })
            this.win.redraw()
        })
    }
    redraw(gfx) {
        gfx.rect(this.x,this.y,this.width,this.height,'red')
        super.redraw(gfx)
    }
}
class CustomMenu extends Container {
    constructor(opts,item,app,win) {
        super(opts);
        this.item = item
        this.app = app
        this.win = win
        this.children = this.item.children.map((item,i) => {
            return new MenuItem({text:item.label,x:1, y:1+20*i,width:20,height:10, item:item, win:win, action:()=>{
                win.close()
                app.send(INPUT.MAKE_Action({command:item.command}))
            }})
        })
    }
    redraw(gfx) {
        gfx.rect(this.x, this.y, this.width, this.height, 'black')
        gfx.rect(this.x+1, this.y+1, this.width-2, this.height-2, 'red')
        super.redraw(gfx)
    }
}

async function init() {
    await app.a_init()
    let win = await app.open_window(0,0,1024/4,20,'menubar')
    win.root = new CustomMenuBar({width:win.width, height:win.height},menu_tree,app,win)
    win.redraw()
}




app.on('start',()=>init())
