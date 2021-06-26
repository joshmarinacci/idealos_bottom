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
        if(!this.visible) return
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
        this.padding = 2
    }
    layout(gfx) {
        let lines = this.text.split("\n")
        let maxw = 0
        let h = this.padding
        lines.forEach(line => {
            let met = gfx.text_size(this.text,this.font)
            h += met.height
            maxw = Math.max(maxw,met.width+this.padding*2)
        })
        this.width = maxw
        this.height = h + this.padding
    }
    redraw(gfx) {
        let bg = this.lookup_theme_part("background-color",null)
        let co = this.lookup_theme_part('color',null)
        gfx.rect(this.x, this.y, this.width, this.height,bg)
        let lines = this.text.split("\n")
        let h = this.padding
        lines.forEach(line => {
            let met = gfx.text_size(this.text,this.font)
            gfx.text(this.x+this.padding, this.y+h, line,co,this.font)
            h += met.height
        })
    }
}

function is_word_char(evt) {
    // console.log("checking key",evt)
    // console.log(INFO.NAME_TO_KEY[evt.code])
    if(!INFO.NAME_TO_KEY[evt.code]) return false
    let first = INFO.NAME_TO_KEY[evt.code][0]
    return first.type === "CHAR"
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
        if( e.type === INPUT.TYPE_Action) return this.handle_action(e)
        if (e.type === INPUT.TYPE_MouseDown) {
            this.selected = true
            this.repaint(e)
            return
        }
        if (is_word_char(e)) return this.append_char(e.key)
        if (e.code === INFO.KEY_NAMES.Backspace) {
            if (this.text.length > 0) {
                let before = this.text.substring(0, this.cursor)
                let after = this.text.substring(this.cursor)
                this.text = before.substring(0, before.length - 1) + after
                this.cursor = Math.max(this.cursor - 1, 0)
                this.repaint(e)
            }
        }
        if (e.code === INFO.KEY_NAMES.ArrowLeft) return this.nav_left(e)
        if (e.code === INFO.KEY_NAMES.ArrowRight) return this.nav_right(e)
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
        this.text = this.text.slice(0,this.cursor) + ch + this.text.slice(this.cursor)
        this.cursor += 1
        this.repaint()
    }

    nav_left(e) {
        this.cursor = Math.max(this.cursor - 1, 0)
        this.repaint(e)
    }
    nav_right(e) {
        this.cursor = Math.min(this.cursor + 1, this.text.length)
        this.repaint(e)
    }
    nav_up(e) {
        // console.log("nav up")
    }
    nav_down(e) {
        // console.log("nav down")
    }

    handle_action(e) {
        if(e.command === "navigate-cursor-right") return this.nav_right(e)
        if(e.command === "navigate-cursor-left") return this.nav_left(e)
        if(e.command === "navigate-cursor-up") return this.nav_up(e)
        if(e.command === "navigate-cursor-down") return this.nav_down(e)
    }
}


export class MultilineTextBox extends TextBox {
    constructor(opts) {
        super(opts)
        this.text = opts.text || "textbox"
        this.padding = new Insets(2)
        this.cursor = 2
        this.selected = false
        this.name = 'textbox'
    }
    input(e) {
        if( e.type === INPUT.TYPE_Action) return this.handle_action(e)
        if (e.type === INPUT.TYPE_MouseDown) {
            this.selected = true
            this.repaint(e)
            return
        }
        if (is_word_char(e)) {
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
        if (e.key === "Enter") {
            this.fire('action', {target: this})
        }
    }
    layout(gfx) {
        //wrap and draw the text
        let x = this.padding.left
        let y = this.padding.top
        this.cx = 0
        this.cy = 0
        this.lines = []
        let line = ""
        for(let i=0; i<this.text.length; i++) {
            let ch = this.text[i]
            let met = gfx.text_size(""+ch, this.font)
            // gfx.text(this.x+x,this.y+y,""+ch,this.font)
            line += ch
            if(i === this.cursor) {
                this.cx = x
                this.cy = y
            }
            x += met.width
            if(x > this.width) {
                //start next line
                x = this.padding.left
                this.lines.push(line)
                line = ""
                y += 10
            }
        }
        this.lines.push(line)

    }
    cursor_to_lc(cursor) {
        let len = 0
        let n = 0
        for(let line of this.lines) {
            if(this.cursor > len && this.cursor < len + line.length) {
                // console.log("cursor inside line",line)
                break;
            }
            len += line.length
            n+=1
        }
        return {
            line:n,
            col:cursor-len
        }
    }
    lc_to_cursor(lc) {
        let cursor = 0
        for(let i=0; i<this.lines.length; i++) {
            let line = this.lines[i]
            if(lc.line === i) {
                cursor += lc.col
                break
            } else {
                cursor += line.length
            }
        }
        return cursor
    }
    nav_up(e) {
        let lc = this.cursor_to_lc(this.cursor)
        if(lc.line > 0) {
            lc.line--
            this.cursor = this.lc_to_cursor(lc)
        }
        this.repaint()
    }
    nav_down(e) {
        let lc = this.cursor_to_lc(this.cursor)
        if(lc.line < this.lines.length) {
            lc.line++
            this.cursor = this.lc_to_cursor(lc)
        }
        this.repaint()
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

        //wrap and draw the text
        let x = this.padding.left
        let y = this.padding.top
        this.lines.forEach((line,i) => {
            gfx.text(this.x+x,this.y+y+i*10,line)
        })

        if (gfx.win.is_focused(this)) {
            gfx.rect(this.x + this.cx, this.y + this.cy, 1, 10, 'red')
        }
    }
}
