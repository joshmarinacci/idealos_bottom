import {INPUT} from 'idealos_schemas/js/input.js'
import {Component, Insets} from './guitoolkit.js'
import {VBox} from './panels.js'

export class Button extends Component {
    constructor(opts) {
        super(opts)
        this.name = 'button'
        this.text = opts.text || "button"
        this.text_key = opts.text_key
        this.pressed = false
        this.padding = new Insets(3)
        this.action = opts.action || null
    }

    input(e) {
        if(e.type === INPUT.TYPE_MouseDown) {
            this.pressed = true
            this.repaint(e)
            return true
        }
        if(e.type === INPUT.TYPE_MouseUp) {
            this.pressed = false
            this.repaint(e)
            this.fire('action', {})
            if(this.action) this.action()
        }
    }

    layout(gfx) {
        if(this.text_key) this.text = this.lookup_translated_text(this.text_key)
        let met = gfx.text_size(this.text,this.font)
        this.width = this.padding.left + met.width + this.padding.right
        this.height = this.padding.top + met.height + this.padding.bottom
    }

    redraw(gfx) {
        let state = this.pressed?"pressed":null
        let bd = this.lookup_theme_part("border-color",state)
        let bg = this.lookup_theme_part("background-color",state)
        let co = this.lookup_theme_part('color',state)
        gfx.rect(this.x, this.y, this.width, this.height,bd)
        gfx.rect(this.x+1, this.y+1, this.width-2, this.height-2,bg)
        gfx.text(this.padding.left + this.x, this.y+this.padding.top, this.text,co,this.font)
    }

}

export class ToggleButton extends Button {
    constructor(opts) {
        super(opts);
        this.selected = !!opts.selected
    }
    input(e) {
        super.input(e)
        if(e.type === INPUT.TYPE_MouseDown) {
            this.selected = !this.selected
            this.repaint()
        }
    }

    redraw(gfx) {
        let state = this.pressed?"pressed":null
        if(this.selected) state = 'selected'
        let bd = this.lookup_theme_part("border-color",state)
        let bg = this.lookup_theme_part('background-color',state)
        let txt = this.lookup_theme_part('color',state)
        gfx.rect(this.x, this.y, this.width, this.height,bd)
        gfx.rect(this.x+1, this.y+1, this.width-2, this.height-2,bg)
        gfx.text(this.padding.left + this.x, this.y+this.padding.top, this.text, txt);
    }
}

export class CheckButton extends ToggleButton {
    constructor(opts) {
        super(opts);
    }
    layout(gfx) {
        this.width = 10 + this.padding.left + this.padding.right
        this.height = 10 + this.padding.top + this.padding.bottom
    }
    redraw(gfx) {
        let state = this.pressed?"pressed":null
        if(this.selected) state = 'selected'
        let color = this.lookup_theme_part('color',state)
        gfx.text(this.padding.left + this.x, this.y,
            this.selected?String.fromCharCode(21):String.fromCharCode(20),
            color)
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
                this.popup.shrink_to_fit()
            })
        })
        this.arrow = String.fromCharCode(16)
    }
    layout(gfx) {
        let met = gfx.text_size(this.text)
        let met2 = gfx.text_size('Z')
        this.width = this.padding.left + met.width + 2 + met2.width + this.padding.right
        this.height = this.padding.top + met.height + this.padding.bottom
    }
    redraw(gfx) {
        let state = this.pressed?"pressed":null
        let bd = this.lookup_theme_part("border-color",state)
        let bg = this.lookup_theme_part("background-color",state)
        let fg = this.lookup_theme_part("color",state)
        gfx.rect(this.x, this.y, this.width, this.height,bd)
        gfx.rect(this.x+1, this.y+1, this.width-2, this.height-2,bg)
        gfx.text(this.padding.left + this.x, this.y+this.padding.top, this.text, fg)
        let met = gfx.text_size(this.text,this.window().base_font)
        gfx.text(this.padding.left + this.x + met.width + 2, this.y, this.arrow, fg)
    }
}

