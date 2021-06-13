import {INPUT} from 'idealos_schemas/js/input.js'
import {Component, Insets, MAGENTA} from './guitoolkit.js'
import {VBox} from './panels.js'

export class Button extends Component {
    constructor(opts) {
        super(opts)
        this.name = 'button'
        this.text = opts.text || "button"
        this.text_key = opts.text_key
        this.pressed = false
        this.padding = new Insets(5)
        this.action = opts.action || null
    }

    input(e) {
        if(e.type === INPUT.TYPE_MouseDown) {
            this.pressed = true
            this.repaint(e)
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
        let met = gfx.text_size(this.text)
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
        let state = this.pressed?"pressed":null
        if(this.selected) state = 'selected'
        let bg = this.lookup_theme_part('background-color',state)
        let txt = this.lookup_theme_part('color',state)
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
        let state = this.pressed?"pressed":null
        let bg = this.lookup_theme_part("background-color",state)
        let fg = this.lookup_theme_part("color",state)
        gfx.rect(this.x, this.y, this.width, this.height, bg)
        gfx.text(this.padding.left + this.x, this.y, this.text, fg, this.window().base_font)
        let met = gfx.text_size(this.text,this.window().base_font)
        gfx.text(this.padding.left + this.x + met.width + 2, this.y, 'g', fg, this.window().symbol_font)
    }
}

