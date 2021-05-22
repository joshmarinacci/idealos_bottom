import {INPUT} from 'idealos_schemas/js/input.js'
import {Component, Insets, MAGENTA} from './guitoolkit.js'
import {VBox} from './panels.js'

export class Button extends Component {
    constructor(opts) {
        super(opts)
        this.text = opts.text || "button"
        this.pressed = false
        this.padding = new Insets(5)
        this.action = opts.action || null
    }

    input(e) {
        if(e.type === INPUT.TYPE_MouseDown) {
            this.pressed = true
            this.repaint()
        }
        if(e.type === INPUT.TYPE_MouseUp) {
            this.pressed = false
            this.repaint()
            this.fire('action', {})
            if(this.action) this.action()
        }
    }

    layout(gfx) {
        let met = gfx.text_size(this.text)
        this.width = this.padding.left + met.width + this.padding.right
        this.height = this.padding.top + met.height + this.padding.bottom
    }

    lookup_theme_part(name,state) {
        if(!this.theme && !this.theme_loading) {
            this.theme_loading = true
            // console.log("need to get a theme")
            this.window().app.on("get_control_theme_response", (msg) => {
                // console.log("got the response finally", msg)
                this.theme = msg.payload.theme
                this.theme_loading = false
                this.repaint()
            })
            this.window().send({
                type: "get_control_theme",//(name, style, state) style can be * state can be *"
                name: "button",
                style: "plain",
                state: "normal",
            })
            return 'black'
        }
        if(!this.theme && this.theme_loading) {
            return 'black'
        }
        // console.log("using theme",this.theme,name,state)
        if(state) {
            // console.log("checking out state",state,name,this.theme)
            if(this.theme.states[state]) {
                return this.theme.states[state][name]
            }
        }
        return this.theme[name]
    }
    redraw(gfx) {
        let state = this.pressed?"pressed":null
        let bg = this.lookup_theme_part("background-color",state)
        let co = this.lookup_theme_part('color',state)
        gfx.rect(this.x, this.y, this.width, this.height,bg)
        gfx.text(this.padding.left + this.x, this.y, this.text,co)
    }

}

export class ToggleButton extends Button {
    constructor(opts) {
        super(opts);
        this.selected = false
    }
    input(e) {
        super.input(e)
        if(e.type === INPUT.TYPE_MouseDown) {
            this.selected = !this.selected
            this.repaint()
        }
    }

    redraw(gfx) {
        let name = 'button'
        if(this.selected) name = 'button:selected'
        let bg = gfx.theme_bg_color(name,MAGENTA);
        let txt = gfx.theme_text_color(name,MAGENTA);
        gfx.rect(this.x, this.y, this.width, this.height, bg);
        gfx.text(this.padding.left + this.x, this.y, this.text, txt);
    }
}

export class PopupButton extends Button {
    constructor(opts) {
        super(opts);
        this.items = opts.items
        this.on('action',()=>{
            let win = this.window()
            let pos = this.position_in_window()
            let x = win.x + pos.x + this.bounds().width
            let y = win.y + pos.y
            win.a_open_child_window(x,y,
                40,80,
                'menu').then(popup => {
                this.popup = popup
                this.popup.root = new VBox({
                    width:40,
                    height:80,
                    hstretch:true,
                    children:this.items.map(it => {
                        return new Button({
                            text:it,
                            action:()=>{
                                this.text = it
                                this.repaint()
                                this.popup.close()
                            }
                        })
                    })
                })
                this.popup.root.parent = this.popup
                this.popup.repaint()
            })
        })
    }
    layout(gfx) {
        let met = gfx.text_size(this.text,this.window().base_font)
        let met2 = gfx.text_size('a',this.window().symbol_font)
        this.width = this.padding.left + met.width + 2 + met2.width + this.padding.right
        this.height = this.padding.top + met.height + this.padding.bottom
    }
    redraw(gfx) {
        let bg = gfx.theme_bg_color("button",'magenta')
        if(this.pressed) bg = gfx.theme_bg_color('button:pressed', MAGENTA)
        let fg = gfx.theme_text_color('button', 'magenta')
        if(this.pressed) fg = gfx.theme_text_color('button:pressed', MAGENTA)
        gfx.rect(this.x, this.y, this.width, this.height, bg)
        gfx.text(this.padding.left + this.x, this.y, this.text, fg, this.window().base_font)
        let met = gfx.text_size(this.text,this.window().base_font)
        gfx.text(this.padding.left + this.x + met.width + 2, this.y, 'g', fg, this.window().symbol_font)
    }
}

