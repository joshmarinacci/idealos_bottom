import {INPUT} from 'idealos_schemas/js/input.js'
import {INFO} from 'idealos_schemas/js/keyboard_map.js'
import {Component, Insets, MAGENTA} from './guitoolkit.js'


export class Label extends Component {
    constructor(opts) {
        super(opts)
        this.text = opts.text || "label"
        this.name = 'label'
    }

    input(e) {
        // console.log("label got event",e.type)
    }

    layout(gfx) {
        let met = gfx.text_size(this.text,this.font)
        this.width = met.width
        this.height = met.height
    }

    redraw(gfx) {
        let bg = this.lookup_theme_part("background-color",null)
        let co = this.lookup_theme_part('color',null)
        gfx.rect(this.x, this.y, this.width, this.height,bg)
        gfx.text(this.x, this.y, this.text,co,this.font)
    }
}

export class TranslatedLabel extends Component {
    constructor(opts) {
        super(opts)
        this.text = "-----"
        this.text_key = opts.text_key || "[?]"
        this.name = 'translated-label'
    }
    layout(gfx) {
        this.text = this.lookup_translated_text(this.text_key)
        let met = gfx.text_size(this.text,this.font)
        this.width = met.width
        this.height = met.height
    }
    redraw(gfx) {
        let bg = this.lookup_theme_part("background-color",null)
        let co = this.lookup_theme_part('color',null)
        gfx.rect(this.x, this.y, this.width, this.height,bg)
        gfx.text(this.x, this.y, this.text,co,this.font)
    }
}

export class MultilineLabel extends Component {
    constructor(opts) {
        super(opts);
        this.text = opts.text || "-------"
        this.name = 'multiline-label'
    }
    layout(gfx) {
        let lines = this.text.split("\n")
        let maxw = 0
        let h = 0
        lines.forEach(line => {
            let met = gfx.text_size(this.text,this.font)
            h += met.height
            maxw = Math.max(maxw,met.width)
        })
        this.width = maxw
        this.height = h
    }
    redraw(gfx) {
        let bg = this.lookup_theme_part("background-color",null)
        let co = this.lookup_theme_part('color',null)
        gfx.rect(this.x, this.y, this.width, this.height,bg)
        let lines = this.text.split("\n")
        let h = 0
        lines.forEach(line => {
            gfx.text(this.x, this.y+h, line,co,this.font)
            h += 10
        })
    }
}

export class TextBox extends Component {

    constructor(opts) {
        super(opts)
        this.text = opts.text || "textbox"
        this.padding = new Insets(5)
        this.cursor = 2
        this.selected = false
        this.name = 'textbox'
    }

    input(e) {
        if( e.type === INPUT.TYPE_Action) {
            if(e.command === "navigate-cursor-right") {
                this.cursor = Math.min(this.cursor + 1, this.text.length)
                this.repaint(e)
            }
        }
        if (e.type === INPUT.TYPE_MouseDown) {
            this.selected = true
            this.repaint(e)
            return
        }
        if (this.is_word_char(e)) {
            return this.append_char(e.key)
        }
        if (e.code === INFO.KEY_NAMES.Backspace) {
            if (this.text.length > 0) {
                let before = this.text.substring(0, this.cursor)
                let after = this.text.substring(this.cursor)
                this.text = before.substring(0, before.length - 1) + after
                this.cursor = Math.max(this.cursor - 1, 0)
                this.repaint(e)
            }
        }
        if (e.code === INFO.KEY_NAMES.ArrowLeft) {
            this.cursor = Math.max(this.cursor - 1, 0)
            this.repaint(e)
        }
        if (e.code === INFO.KEY_NAMES.ArrowRight) {
            this.cursor = Math.min(this.cursor + 1, this.text.length)
            this.repaint(e)
        }
        if (e.key === "Enter") {
            this.fire('action', {target: this})
        }
    }

    redraw(gfx) {
        let name = "textbox"
        if (gfx.win.is_focused(this)) name = "textbox:focused"
        let state = (gfx.win.is_focused(this))?"focused":null
        let bd = this.lookup_theme_part("border-color",state)
        let bg = this.lookup_theme_part("background-color",state)
        let co = this.lookup_theme_part('color',state)

        gfx.rect(this.x , this.y, this.width , this.height, bd)
        gfx.rect(this.x + 1, this.y + 1, this.width - 2, this.height - 2, bg)
        gfx.text(this.padding.left + this.x, this.y, this.text, co)
        if (gfx.win.is_focused(this)) {
            let before = this.text.substring(0, this.cursor)
            let before_metrics = gfx.text_size(before)
            gfx.rect(this.x + this.padding.left + before_metrics.width, this.y + 2, 1, this.height - 4, co)
        }
    }

    append_char(ch) {
        this.text += ch
        // console.log("new text is",this.text)
        this.cursor += 1
        this.repaint()
    }

    is_word_char(evt) {
        // console.log("checking key",evt)
        // console.log(INFO.NAME_TO_KEY[evt.code])
        if(!INFO.NAME_TO_KEY[evt.code]) return false
        let first = INFO.NAME_TO_KEY[evt.code][0]
        return first.type === "CHAR"
    }
}
