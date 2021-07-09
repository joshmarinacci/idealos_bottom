import {INPUT} from 'idealos_schemas/js/input.js'
import {INFO} from 'idealos_schemas/js/keyboard_map.js'
import {Component, Insets, MAGENTA} from './guitoolkit.js'


export class Label extends Component {
    constructor(opts) {
        super(opts)
        this.text = opts.text || "label"
        this.name = 'label'
        this.padding = 3
    }

    layout(gfx) {
        let met = gfx.text_size(this.text,this.font)
        this.width = this.padding + met.width + this.padding
        this.height = this.padding + met.height + this.padding
    }

    redraw(gfx) {
        if(!this.visible) return
        let bg = this.lookup_theme_part("background-color",null)
        let co = this.lookup_theme_part('color',null)
        gfx.rect(this.x, this.y, this.width, this.height,bg)
        gfx.text(this.x+this.padding, this.y+this.padding, this.text,co,this.font)
    }
}

export class TranslatedLabel extends Label {
    constructor(opts) {
        super(opts)
        this.text = "-----"
        this.text_key = opts.text_key || "[?]"
        this.name = 'translated-label'
    }
    layout(gfx) {
        this.text = this.lookup_translated_text(this.text_key)
        super.layout(gfx)
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
    set_text(text) {
        this.text = text
        this.cursor = 2
    }
    append_char(ch) {
        this.text = this.text.slice(0, this.cursor) + ch + this.text.slice(this.cursor)
        this.cursor += 1
        this.fire("change",{target:this})
    }

    input(e) {
        // this.window().log("textbox got input",e)
        if( e.type === INPUT.TYPE_Action) return this.handle_action(e)
        if (e.type === INPUT.TYPE_MouseDown) {
            this.selected = true
            this.repaint(e)
            return true
        }
        if (is_word_char(e)) {
            this.append_char(e.key)
            this.repaint(e)
            return true
        }
        if (e.code === INFO.KEY_NAMES.Backspace) return this.delete_backward()
        if (e.code === INFO.KEY_NAMES.ArrowLeft) return this.nav_left(e)
        if (e.code === INFO.KEY_NAMES.ArrowRight) return this.nav_right(e)
        if (e.key === "Enter") {
            this.fire('action', {target: this})
            return true
        }
        return false
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


    delete_backward(e) {
        if (this.text.length > 0) {
            let before = this.text.substring(0, this.cursor)
            let after = this.text.substring(this.cursor)
            this.text = before.substring(0, before.length - 1) + after
            this.cursor = Math.max(this.cursor - 1, 0)
            this.fire("change",{target:this})
            this.repaint(e)
        }
        return true
    }
    delete_forward(e) {
        let before = this.text.substring(0, this.cursor)
        let after = this.text.substring(this.cursor)
        this.text = before + after.substring(1)
        // this.cursor += 1
        if(this.cursor >= this.text.length) this.cursor = this.text.length
        this.fire("change",{target:this})
        this.repaint(e)
    }

    nav_left(e) {
        this.cursor = Math.max(this.cursor - 1, 0)
        this.repaint(e)
        return true
    }
    nav_right(e) {
        this.cursor = Math.min(this.cursor + 1, this.text.length)
        this.repaint(e)
        return true
    }
    nav_up(e) {
        // console.log("nav up")
    }
    nav_down(e) {
        // console.log("nav down")
    }
    nav_start_line(e) {
        this.cursor = 0
        this.repaint(e)
    }
    nav_end_line(e) {
        this.cursor = this.text.length
        this.repaint(e)
    }

    handle_action(e) {
        // console.log("action",e)
        if(e.command === "navigate-cursor-right") return this.nav_right(e)
        if(e.command === "navigate-cursor-left") return this.nav_left(e)
        if(e.command === "navigate-cursor-up") return this.nav_up(e)
        if(e.command === "navigate-cursor-down") return this.nav_down(e)
        if(e.command === "navigate-cursor-line-start") return this.nav_start_line(e)
        if(e.command === "navigate-cursor-line-end") return this.nav_end_line(e)
        if(e.command === "delete-character-backward") return this.delete_backward()
        if(e.command === "delete-character-forward") return this.delete_forward()
    }
}


export const BIAS = {
    LEFT:'LEFT',
    RIGHT:'RIGHT',
}

export class TextLayout {
    constructor() {
        this.text = ""
        this.cursor = 0
        this.bias = BIAS.LEFT
        this.lines = [""]
    }

    set_text(txt) {
        this.text = txt
        this.cursor = 0
        this.bias = BIAS.LEFT
        this.lines = [""]
    }
    insert_char_at_cursor(ch) {
        let n = this.cursor
        if(this.bias === BIAS.LEFT) n = this.cursor
        if(this.bias === BIAS.RIGHT) n = this.cursor+1
        this.text = this.text.slice(0, n) + ch + this.text.slice(n)
        this.cursor += 1
    }

    layout_as_blocks(w) {
        this.lines = []
        let x = 0
        let y = 0
        let line = ""
        for(let i=0; i<this.text.length; i++) {
            let ch = this.text[i]
            line += ch
            let met = {width: 1}
            x += met.width
            if(x >= w) {
                x = 0
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
            if(this.cursor >= len && this.cursor < len + line.length) {
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
    cursor_to_xy(cursor, font) {
        let lc = this.cursor_to_lc(cursor)
        // console.log(lc, this.bias)
        let line = this.lines[lc.line]
        let x = 0
        for(let i=0; i<=lc.col; i++) {
            let cch = line.charCodeAt(i)
            let mets = font.find_glyph_by_id(cch)
            let met = {
                width : mets.width - mets.left - mets.right,
            }
            // console.log("metrics",met, this.bias)
            if(i===lc.col) {
                // console.log('at the end with bias',this.bias)
                if(this.bias === BIAS.RIGHT) {
                    x += met.width
                    break;
                }
                break;
            }
            x += met.width
        }
        return {
            x:x,
            y:lc.line*10,
        }
    }

    layout_as_blocks_with_breaks(w) {
        this.lines = []
        let line = ""
        let last_space = -1
        let last_space_i = -1
        let x = 0
        let y = 0
        for(let i=0; i<this.text.length; i++) {
            // console.log(i)
            let ch = this.text[i]
            if(ch === ' ') {
                // console.log("space")
                last_space = line.length
                last_space_i = i
            }
            if(ch === '\n') {
                // console.log("new line")
                last_space_i = -1
                last_space = -1
                line += ch
                this.lines.push(line)
                line = ""
                x = 0
                y += 10
                continue;
            }
            line += ch
            let met = {width: 1}
            x += met.width
            if(x >= w) {
                // console.log("too far",x,i)
                // console.log("last space",last_space)
                let before = line.slice(0,last_space+1)
                let after = line.slice(last_space+1)
                // console.log("before:"+before+':after:'+after+':')
                x = 0
                // console.log("--",before)
                this.lines.push(before)
                line = ""
                i = last_space_i
                // console.log("set i to",last_space_i)
                y += 10
            }
        }
        this.lines.push(line)
    }

    layout_as_blocks_with_breaks_and_font(w, font) {
        this.lines = []
        let line = ""
        let last_space = -1
        let last_space_i = -1
        let x = 0
        let y = 0
        let _count = 0
        for(let i=0; i<this.text.length; i++) {
            _count++
            if(_count > 1000) {
                throw new Error(`infinite loop: width = ${w}`)
            }
            let ch = this.text[i]
            if(ch === ' ') {
                // console.log("space")
                last_space = line.length
                last_space_i = i
            }
            if(ch === '\n') {
                // console.log("new line")
                last_space_i = -1
                last_space = -1
                line += ch
                this.lines.push(line)
                line = ""
                x = 0
                y += 10
                continue;
            }
            let cch = ch.charCodeAt(0)
            // console.log(i,ch,cch,x)//,font.find_glyph_by_id(cch))
            line += ch
            let mets = font.find_glyph_by_id(cch)
            let met = {
                width : mets.width - mets.left - mets.right,
            }
            // console.log(met)
            // let met = {width: 1}
            x += met.width
            if(x >= w) {
                // console.log("too far",x,i)
                // console.log("last space",last_space)
                let before = line.slice(0,last_space+1)
                let after = line.slice(last_space+1)
                // console.log("before:"+before+':after:'+after+':')
                x = 0
                // console.log("--",before)
                this.lines.push(before)
                line = ""
                i = last_space_i
                // console.log("set i to",last_space_i)
                y += 10
            }
        }
        this.lines.push(line)

    }


    nav_left() {
        if(this.bias === BIAS.RIGHT) {
            this.bias = BIAS.LEFT
            return
        }
        if(this.bias === BIAS.LEFT) {

            let lc = this.cursor_to_lc(this.cursor)
            if(lc.col === 0 && lc.line === 0) {
                this.cursor = 0
                this.bias = BIAS.LEFT
                return
            }
            if(lc.col === 0) {
                this.cursor--
                this.bias = BIAS.RIGHT
                return
            }

            this.cursor--
            if(this.cursor < 0) {
                this.cursor = 0
            }
            return
        }
    }
    nav_right() {
        if(this.bias === BIAS.LEFT) {
            this.bias = BIAS.RIGHT
            return
        }
        let lc = this.cursor_to_lc(this.cursor)
        //should wrap
        if(lc.col === this.lines[lc.line].length-1 && lc.line < this.lines.length-1 ) {
            this.cursor++
            this.bias = BIAS.LEFT
            return
        }
        //move on same line
        if(lc.col < this.lines[lc.line].length-1) {
            this.cursor++
        }
    }
    nav_up() {
        let lc = this.cursor_to_lc(this.cursor)
        if(lc.line > 0) {
            lc.line--
            this.cursor = this.lc_to_cursor(lc)
        }
    }
    nav_down() {
        let lc = this.cursor_to_lc(this.cursor)
        if(lc.line < this.lines.length-1) {
            lc.line++
            if(lc.col >= this.lines[lc.line].length) {
                lc.col = this.lines[lc.line].length-1
            }
            this.cursor = this.lc_to_cursor(lc)
        }
    }
    nav_start_line() {
        let lc = this.cursor_to_lc(this.cursor)
        lc.col = 0
        this.cursor = this.lc_to_cursor(lc)
        this.bias = BIAS.LEFT
    }
    nav_end_line() {
        let lc = this.cursor_to_lc(this.cursor)
        lc.col = this.lines[lc.line].length-1
        this.cursor = this.lc_to_cursor(lc)
        this.bias = BIAS.RIGHT
    }

    delete_backward() {
        if (this.text.length > 0) {
            let n = this.cursor
            if(this.bias === BIAS.RIGHT) n++
            let before = this.text.substring(0, n)
            let after = this.text.substring(n)
            this.text = before.substring(0, before.length - 1) + after
            // this.bias = BIAS.LEFT
            this.cursor = Math.max(this.cursor - 1, 0)
        }
    }
    delete_forward() {
        let n = this.cursor
        if(this.bias === BIAS.RIGHT) n++
        let before = this.text.substring(0, n)
        let after = this.text.substring(n)
        this.text = before + after.substring(1)
        if(this.cursor >= this.text.length) this.cursor = this.text.length
    }

    dump() {
        return {
            text:this.text,
            cursor:this.cursor,
            bias:this.bias,
            lines:this.lines.slice()
        }
    }
}




export class MultilineTextBox extends TextBox {
    constructor(opts) {
        super(opts)
        this.tl = new TextLayout()
        this.tl.text = opts.text || "textbox"
        this.padding = new Insets(2)
        this.selected = false
        this.name = 'textbox'
    }
    set_text(txt) {
        this.tl.set_text(txt)
        this.repaint()
    }
    input(e) {
        if( e.type === INPUT.TYPE_Action) return this.handle_action(e)
        if (e.type === INPUT.TYPE_MouseDown) {
            this.selected = true
            this.repaint(e)
            return true
        }
        if (is_word_char(e)) {
            this.tl.insert_char_at_cursor(e.key)
            this.repaint(e)
            return true
        }
        if (e.code === INFO.KEY_NAMES.Backspace) {
            this.tl.delete_backward()
            this.repaint(e)
            return true
        }
        if (e.key === "Enter") {
            this.fire('action', {target: this})
            return true
        }
        return false
    }
    layout(gfx) {
        //wrap and draw the text
        this.tl.layout_as_blocks_with_breaks_and_font(this.width,gfx.font())
    }
    handle_action(e) {
        // console.log("action",e)
        if(e.command === "navigate-cursor-right")      this.tl.nav_right()
        if(e.command === "navigate-cursor-left")       this.tl.nav_left()
        if(e.command === "navigate-cursor-up")         this.tl.nav_up()
        if(e.command === "navigate-cursor-down")       this.tl.nav_down()
        if(e.command === "navigate-cursor-line-start") this.tl.nav_start_line()
        if(e.command === "navigate-cursor-line-end")   this.tl.nav_end_line()
        if(e.command === "delete-character-backward")  this.tl.delete_backward()
        if(e.command === "delete-character-forward")   this.tl.delete_forward()
        this.repaint(e)
        return true
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
        this.tl.lines.forEach((line,i) => {
            gfx.text(this.x+x,this.y+y+i*10,line)
        })

        if (gfx.win.is_focused(this)) {
            let pt = this.tl.cursor_to_xy(this.tl.cursor,gfx.font())
            gfx.rect(this.x + x+pt.x, this.y + y+ pt.y, 1, 11, 'red')
        }
    }
}
