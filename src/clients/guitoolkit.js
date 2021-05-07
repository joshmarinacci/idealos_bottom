import {WINDOWS} from 'idealos_schemas/js/windows.js'
import {RESOURCES} from 'idealos_schemas/js/resources.js'
import {INPUT} from 'idealos_schemas/js/input.js'
import {GRAPHICS} from 'idealos_schemas/js/graphics.js'
import {default as WebSocket} from 'ws'
import {PixelFont} from './app_utils.js'

export class Point {
    constructor(x,y) {
        this.x = x
        this.y = y
    }
    subtract(pt2) {
        return new Point(
            this.x-pt2.x,
            this.y - pt2.y,
        )
    }

    add(pt) {
        return new Point(
            this.x + pt.x,
            this.y + pt.y,
        )
    }
}
export class Bounds {
    constructor(x,y,w,h) {
        this.x = x
        this.y = y
        this.width = w
        this.height = h
    }
    contains(pt) {
        if(pt.x < this.x) return false
        if(pt.x > this.x+this.width) return false
        if(pt.y < this.y) return false
        if(pt.y > this.y+this.height) return false
        return true
    }
    translate_into(pt) {
        return new Point(pt.x-this.x,pt.y-this.y)
    }
}

export class App {
    constructor(argv) {
        this._appid = argv[3]
        this.ws = new WebSocket(argv[2]);
        this.listeners = {}
        this.windows = []
        this.ws.on('open', () => {
            this.fireLater('start', {})
        })
        this.ws.on("message", (data) => {
            let msg = JSON.parse(data)
            this.fireLater(msg.type, msg)
        })
        process.on('SIGTERM', () => {
            console.log(`Received SIGTERM in app ${this._appid} `);
            this.a_shutdown().then("done shutting down")
        });
        this._theme = null
        this._font = null
    }

    async a_shutdown() {
        this.windows.forEach(win => {
            console.log("closing window",win._winid,this._appid)
            this.send(WINDOWS.MAKE_window_close_response({
                target:this._appid,
                window:win._winid,
            }))
        })
        setTimeout(()=>{
            this.ws.close()
            process.exit(0)
        },500)
    }
    async a_init() {
        this._font = await PixelFont.load("src/clients/fonts/idealos_font@1.png", "src/clients/fonts/idealos_font@1.json")
        this._symbol_font = await PixelFont.load("src/clients/fonts/symbol_font@1.png","src/clients/fonts/symbol_font@1.json")
        this.on(RESOURCES.TYPE_ResourceChanged, (e)=>{
            if(e.payload.resource === 'theme') {
                this._theme = JSON.parse(String.fromCharCode(...e.payload.data.data))
                this.fireLater(e)
            }
        })
        this.send(RESOURCES.MAKE_ResourceGet({'resource':'theme','sender':this._appid}))
    }
    open_window(x,y,width,height,window_type) {
        return new Promise((res,rej)=>{
            this.send(WINDOWS.MAKE_WindowOpen({
                width: width,
                height: height,
                sender: this._appid,
                window_type: window_type
            }))
            let handler = (e) => {
                this.off(WINDOWS.TYPE_WindowOpenResponse,handler)
                let win = new Window(this,width,height,e.payload.window,null,false)
                win.base_font = this._font
                win.symbol_font = this._symbol_font
                this.windows.push(win)
                res(win)
            }
            this.on(WINDOWS.TYPE_WindowOpenResponse,handler)
        })
    }
    on(type,cb) {
        if(!this.listeners[type]) this.listeners[type] = []
        this.listeners[type].push(cb)
    }
    off(type,cb) {
        if(!this.listeners[type]) this.listeners[type] = []
        this.listeners[type] = this.listeners[type].filter(c => c !== cb)
    }
    log(...args) { console.log(...args) }
    fireLater(type, payload) {
        setTimeout(()=>{
            let evt = {
                type:type,
                payload:payload
            }
            if(this.listeners[type])  this.listeners[type].forEach(cb => {
                cb(evt)
            })
        },1)
    }
    send(msg) {
        msg.app = this._appid
        this.ws.send(JSON.stringify(msg))
    }
}

class EventDispatcher {
    constructor(win) {
        this.window = win
        this.keyboard_target = null
        this.mouse_target = null
    }

    dispatch(e) {
        if (e.type === INPUT.TYPE_MouseDown) {
            let evt = {
                type:e.type,
                pos: new Point(Math.floor(e.x),Math.floor(e.y))
            }
            return this.dispatch_mousedown(evt,this.window.root)
        }
        if (e.type === INPUT.TYPE_MouseUp) {
            let evt = {
                type:e.type,
                pos: new Point(Math.floor(e.x),Math.floor(e.y))
            }
            return this.dispatch_mouseup(evt,this.window.root)
        }
        if(e.type === INPUT.TYPE_KeyboardDown) {
            let evt = {
                type:e.type,
                keyname:e.keyname,
                shift:e.shift,
            }
            return this.dispatch_keydown(evt,this.window.root)
        }
    }

    dispatch_mousedown(evt,node) {
        console.log(`down`,evt.pos,node.constructor.name, node.children.length)
        for (let ch of node.children) {
            console.log('checking',ch.constructor.name,ch.bounds(),ch.bounds().contains(evt.pos))
            if(ch.bounds().contains(evt.pos)) {
                return this.dispatch_mousedown({
                    type:evt.type,
                    pos: ch.bounds().translate_into(evt.pos)
                },ch)
            }
        }
        this.mouse_target = node
        this.keyboard_target = node
        this.window.set_focused(node)
        node.input(evt)
    }

    dispatch_mouseup(evt,node) {
        if(this.mouse_target) {
            this.mouse_target.input(evt)
            this.mouse_target = null
        }
    }

    dispatch_keydown(evt, root) {
        if(!this.keyboard_target) return console.error("no keyboard target")
        this.keyboard_target.input(evt)
    }
}

export class Window {
    constructor(app, width,height,id,parent=null,is_child=false) {
        this._type = 'window'
        this.app = app
        this._winid = id
        this.width = width
        this.height = height
        this.root = null
        this.focused = null
        this.is_child = is_child
        this.parent = parent
        this.dispatcher = new EventDispatcher(this)
        app.on(INPUT.TYPE_MouseDown,(e)=>{
            if(e.payload.window !== this._winid) return
            this.dispatcher.dispatch(e.payload)
        })
        app.on(INPUT.TYPE_MouseMove,(e)=>{
            if(e.payload.window !== this._winid) return
            this.dispatcher.dispatch(e.payload)
        })
        app.on(INPUT.TYPE_MouseUp,(e)=>{
            if(e.payload.window !== this._winid) return
            this.dispatcher.dispatch(e.payload)
        })
        app.on(WINDOWS.TYPE_window_refresh_request, (e)=>{
            if(e.payload.window !== this._winid) return
            this.redraw()
        })
        app.on(INPUT.TYPE_KeyboardDown, (e)=>{
            if(e.payload.window !== this._winid) return
            this.dispatcher.dispatch(e.payload)
        })
        app.on(RESOURCES.TYPE_ResourceChanged, (e)=>{
            if(e.payload.resource === 'theme') {
                // app.theme = JSON.parse(String.fromCharCode(...e.payload.data.data))
                // app.win.redraw()
                this.redraw()
            }
        })
    }
    repaint() {
        console.log("repainting window")
        this.redraw()
    }
    redraw() {
        if(!this.root) return
        this.root.parent = this
        let gfx = new Gfx(this.app,this)
        this.root.layout(gfx)
        this.root.redraw(gfx)
    }
    is_focused(el) {
        if(this.focused && this.focused === el) return true
        return false
    }
    set_focused(el) {
        this.focused = el
    }
    a_open_child_window(x,y,width,height,style) {
        return new Promise((res,rej)=>{
            this.app.send(WINDOWS.MAKE_create_child_window({
                parent:this._winid,
                x:x,
                y:y,
                width: width,
                height: height,
                sender: this.app._appid,
                style: style
            }))
            let handler = (e) => {
                this.app.off(WINDOWS.TYPE_create_child_window_response,handler)
                let win = new Window(this.app,width,height,e.payload.window.id,this,true)
                win.base_font = this.app._font
                win.symbol_font = this.app._symbol_font
                this.app.windows.push(win)
                res(win)
            }
            this.app.on(WINDOWS.TYPE_create_child_window_response,handler)
        })
    }
    close() {
        if(this.is_child) {
            this.app.send(WINDOWS.MAKE_close_child_window({
                parent:this.parent._winid,
                sender:this.app._appid,
                window:this._winid
            }))
        } else {
            this.app.send(WINDOWS.MAKE_window_close_response({
                target: this.app._appid,
                window: this._winid,
            }))
        }
    }
    window() {
        return this
    }

}

class Gfx {
    constructor(app,win) {
        this.app = app
        this.win = win
        this.tx = 0
        this.ty = 0
    }
    translate(x,y) {
        this.tx += x
        this.ty += y
    }
    rect(x,y,width,height,color) {
        return this.app.send(GRAPHICS.MAKE_DrawRect({x:this.tx+x, y:this.ty+y, width, height, color, window:this.win._winid}))
    }

    text(x,y,text,color,font) {
        if(font) return font.draw_text(this.app, this.tx+x, this.ty+y, text, color, this.win)
        return this.app._font.draw_text(this.app,this.tx+x,this.ty+y,text,color,this.win)
    }
    text_size(text, font) {
        if(font) return font.measure_text(this.app,text)
        return this.app._font.measure_text(this.app,text)
    }
    theme_bg_color(name, def) {
        return this.theme_part(name,'background_color',def)
    }
    theme_border_color(name, def) {
        return this.theme_part(name,'border_color',def)
    }
    theme_text_color(name, def) {
        return this.theme_part(name,'text_color',def)
    }
    theme_part(name, part, def) {
        if(this.app._theme && this.app._theme[name] && this.app._theme[name][part]) return this.app._theme[name][part];
        return def;
    }
}


export class Component {
    constructor(opts) {
        this.id = opts.id || ""
        this.x = opts.x || 0
        this.y = opts.y || 0
        this.width = opts.width || 10
        this.height = opts.height || 10
        this.listeners = {}
        this.children = []
        this.font = opts.font || null
    }

    bounds() {
        return new Bounds(this.x,this.y,this.width,this.height)
    }
    on(type, cb) {
        if (!this.listeners[type]) this.listeners[type] = []
        this.listeners[type].push(cb)
    }

    fire(type, payload) {
        if (!this.listeners[type]) this.listeners[type] = []
        this.listeners[type].forEach(cb => cb(payload))
    }

    input(e) {
        return false
    }

    layout(gfx) {
    }

    find(query) {
        if (this.id === query.id) return this
    }
    repaint() {
        console.log("repaint up",this.constructor.name)
        if(this.parent && this.parent.repaint()) this.parent.repaint()
    }
    window() {
        return this.parent.window()
    }
}

export class Container extends Component {
    constructor(opts) {
        super(opts)
        this.children = opts.children || []
        this.children.forEach(ch => ch.parent = this)
    }

    input(e) {
    }

    layout(gfx) {
        this.children.forEach(ch => ch.layout(gfx))
    }

    redraw(gfx) {
        gfx.translate(this.x,this.y)
        this.children.forEach(ch => ch.redraw(gfx))
        gfx.translate(-this.x,-this.y)
    }

    find(query) {
        if (this.id && this.id === query.id) {
            return this
        }
        for (let ch of this.children) {
            let ans = ch.find(query)
            if (ans) return ans
        }
        return null
    }
}

export class Panel extends Container {
    constructor(opts) {
        super(opts)
    }

    redraw(gfx) {
        gfx.rect(this.x, this.y, this.width, this.height, gfx.theme_bg_color('panel', 'white'))
        this.children.forEach(ch => ch.redraw(gfx))
    }
}

export class Label extends Component {
    constructor(opts) {
        super(opts)
        this.text = opts.text || "label"
    }

    input(e) {
        console.log("label got event",e.type)
    }

    layout(gfx) {
        let met = gfx.text_size(this.text,this.font)
        this.width = met.width
        this.height = met.height
    }

    redraw(gfx) {
        gfx.rect(this.x, this.y, this.width, this.height,
            gfx.theme_bg_color('label', 'green'))
        gfx.text(this.x, this.y, this.text,
            gfx.theme_text_color('label', 'yellow'), this.font)
    }
}

export class Insets {
    constructor(m) {
        this.left = m
        this.right = m
        this.top = m
        this.bottom = m
    }
}

const MAGENTA = 'magenta'

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

    redraw(gfx) {
        if (this.pressed) {
            gfx.rect(this.x, this.y, this.width, this.height,
                gfx.theme_bg_color('button:pressed', MAGENTA))
            gfx.text(this.padding.left + this.x, this.y, this.text,
                gfx.theme_text_color('button:pressed', MAGENTA))
        } else {
            gfx.rect(this.x, this.y, this.width, this.height,
                gfx.theme_bg_color('button', 'magenta'))
            gfx.text(this.padding.left + this.x, this.y, this.text,
                gfx.theme_text_color('button', 'magenta'))
        }
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
            win.a_open_child_window(50,50,
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

const WORD_KEYS = {
    'A':true,
}
for(let i=48; i<=57; i++) {
    WORD_KEYS[String.fromCharCode(i)] = true
}
for(let i=65; i<=90; i++) {
    WORD_KEYS[String.fromCharCode(i)] = true
}

export class TextBox extends Component {

    constructor(opts) {
        super(opts)
        this.text = opts.text || "textbox"
        this.padding = new Insets(5)
        this.cursor = 2
        this.selected = false
    }

    input(e) {
        // console.log("textbox input",e)
        if(e.type === INPUT.TYPE_MouseDown) {
            this.selected = true
            console.log("textbox is selected")
            this.repaint()
            return
        }
        if(this.is_word_char(e.keyname)) {
            if(e.shift) {
                return this.append_char(e.keyname.toUpperCase())
            } else {
                return this.append_char(e.keyname.toLowerCase())
            }
        }
        if(e.keyname === 'SPACE') return this.append_char(' ')
        if (e.keyname === 'BACKSPACE') {
            if (this.text.length > 0) {
                let before = this.text.substring(0, this.cursor)
                let after = this.text.substring(this.cursor)
                this.text = before.substring(0, before.length - 1) + after
                this.cursor = Math.max(this.cursor - 1, 0)
                this.repaint()
            }
        }
        if(e.keyname === 'LEFT') {
            this.cursor = Math.max(this.cursor - 1, 0)
            this.repaint()
        }
        if(e.keyname === 'RIGHT') {
            this.cursor = Math.min(this.cursor + 1, this.text.length)
            this.repaint()
        }
            // if (keyboard.keyname === 'Return') {
            //     this.fire('action',{target:this})
            // }
    }

    redraw(gfx) {
        let name = "textbox"
        if (gfx.win.is_focused(this)) name = "textbox:focused"
        gfx.rect(this.x, this.y, this.width, this.height, gfx.theme_border_color(name, MAGENTA))
        gfx.rect(this.x + 1, this.y + 1, this.width - 2, this.height - 2, gfx.theme_bg_color(name, MAGENTA))
        gfx.text(this.padding.left + this.x, this.y, this.text, gfx.theme_text_color(name, MAGENTA))
        if (gfx.win.is_focused(this)) {
            let before = this.text.substring(0, this.cursor)
            let before_metrics = gfx.text_size(before)
            gfx.rect(this.x + this.padding.left + before_metrics.width, this.y + 2, 1, this.height - 4, gfx.theme_text_color(name, MAGENTA))
        }
    }

    append_char(ch) {
        this.text += ch
        console.log("new text is",this.text)
        this.cursor += 1
        this.repaint()
    }

    is_word_char(key) {
        return WORD_KEYS.hasOwnProperty(key)
    }
}

export class VBox extends Container {
    constructor(opts) {
        super(opts);
        this.border_width = opts.border_width || 0
        this.padding = opts.padding || 0
        this.hstretch = opts.hstretch || false
    }
    layout(gfx) {
        this.children.forEach(ch => ch.layout(gfx))
        let y = this.padding
        let maxx = this.padding
        this.children.forEach(ch => {
            ch.x = this.padding
            ch.y = y
            y += ch.height
            y += this.padding
            maxx = Math.max(maxx,this.padding+ch.width+this.padding)
        })
        if(this.hstretch) {
            this.children.forEach(ch => ch.width = maxx)
        }
        this.width = maxx
        this.height = y
    }
    redraw(gfx) {
        gfx.rect(0,0,this.width,this.height,'black')
        super.redraw(gfx)
    }
}

export class HBox extends Container {
    constructor(opts) {
        super(opts);
        this.padding = opts.padding || 0
    }
    layout(gfx) {
        this.children.forEach(ch => ch.layout(gfx))
        let x = this.padding
        let maxy = this.padding
        this.children.forEach(ch => {
            ch.x = x
            ch.y = this.padding
            x += ch.width
            x += this.padding
            maxy = Math.max(maxy,this.padding+ch.height+this.padding)
        })
        this.width = x
        this.height = maxy
    }

}
