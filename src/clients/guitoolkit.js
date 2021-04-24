import {make_message, SCHEMAS} from '../canvas/messages.js'
import {WINDOWS} from '../schemas/windows_schemas.js'
import {RESOURCES} from '../schemas/resources_schemas.js'
import {INPUT} from '../schemas/input_schemas.js'
import {GRAPHICS} from '../schemas/graphics_schemas.js'
import {default as WebSocket} from 'ws'
import {PixelFont} from './app_utils.js'

export class App {
    constructor(argv) {
        this._appid = argv[3]
        this.ws = new WebSocket(argv[2]);
        this.listeners = {}
        this.ws.on('open', () => {
            this.fireLater('start', {})
        })
        this.ws.on("message", (data) => {
            let msg = JSON.parse(data)
            this.fireLater(msg.type, msg)
        })
        process.on('SIGTERM', () => {
            console.log(`Received SIGTERM in app ${appid} `);
            this.ws.close()
            process.exit(0)
        });
        this._theme = null
        this._font = null
    }
    async a_init() {
        this._font = await PixelFont.load("src/clients/fonts/font.png", "src/clients/fonts/font.metrics.json")
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
            this.ws.send(JSON.stringify(WINDOWS.MAKE_WindowOpen({
                width: width,
                height: height,
                sender: this._appid,
                window_type: window_type
            })))
            let handler = (e) => {
                this.log("window was created for us",e)
                this.off(WINDOWS.TYPE_WindowOpenResponse,handler)
                let win = new Window(this,width,height,e.payload.window)
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
        msg.app = this.appid
        this.ws.send(JSON.stringify(msg))
    }
}

export class Window {
    constructor(app, width,height,id) {
        this.app = app
        this._winid = id
        this.width = width
        this.height = height
        this.root = null
        this.focused = null
        this.mouse = {
            x: -1,
            y: -1,
            down: false,
            inside: function (x, y, w, h) {
                if (this.x < x) return false
                if (this.y < y) return false
                if (this.x > x + w) return false
                if (this.y > y + h) return false
                return true
            }
        }
        this.keyboard = {
            keyname: ""
        }
        app.on(INPUT.TYPE_MouseDown,(e)=>{
            this.mouse.x = e.payload.x
            this.mouse.y = e.payload.y
            this.mouse.down = true
            this.input()
            this.redraw()
        })
        app.on(INPUT.TYPE_MouseUp,()=>{
            this.mouse.down = false
            this.input()
            this.redraw()
        })
        app.on(WINDOWS.TYPE_window_refresh_request, ()=>{
            this.redraw()
        })
        app.on(INPUT.TYPE_KeyboardDown, (e)=>{
            // console.log("keyboard pressed in app",e)
            this.keyboard.keyname = e.payload.keyname;
            this.input()
            this.redraw();
        })
        app.on(RESOURCES.TYPE_ResourceChanged, (e)=>{
            if(e.payload.resource === 'theme') {
                // app.theme = JSON.parse(String.fromCharCode(...e.payload.data.data))
                // app.win.redraw()
                this.redraw()
            }
        })
    }
    input() {
        if(!this.root) return
        let mouse_event = {
            x:this.mouse.x,
            y:this.mouse.y,
            translate:function(x,y) {
                this.x += x;
                this.y += y;
            },
            down:this.mouse.down,
            inside:function(x,y, w, h) {
                if (this.x < x) return false
                if (this.y < y) return false
                if (this.x > x + w) return false
                if (this.y > y + h) return false
                return true
            }
        }

        let handled = this.root.input(mouse_event,this.keyboard,this)
        if(!handled) this.set_focused(null)
    }
    redraw() {
        if(!this.root) return
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

    text(x,y,text,color) {
        return this.app._font.draw_text(this.app,this.tx+x,this.ty+y,text,color,this.win);
    }
    text_size(text) {
        return this.app._font.measure_text(this.app,text);
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


class Component {
    constructor(opts) {
        this.id = opts.id || ""
        this.x = opts.x || 0
        this.y = opts.y || 0
        this.width = opts.width || 10
        this.height = opts.height || 10
        this.listeners = {}
    }

    on(type, cb) {
        if (!this.listeners[type]) this.listeners[type] = []
        this.listeners[type].push(cb)
    }

    fire(type, payload) {
        if (!this.listeners[type]) this.listeners[type] = []
        this.listeners[type].forEach(cb => cb(payload))
    }

    input(mouse, keyboard, win) {
        return false
    }

    layout(gfx) {
    }

    find(query) {
        if (this.id === query.id) return this
    }
}

export class Container extends Component {
    constructor(opts) {
        super(opts)
        this.children = opts.children || []
    }

    input(mouse, keyboard, win) {
        mouse.translate(-this.x,-this.y)
        for(let ch of this.children) {
            let handled = ch.input(mouse,keyboard, win)
            if(handled) return true
        }
        mouse.translate(this.x,this.y)
        return false
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

    layout(gfx) {
        let met = gfx.text_size(this.text)
        this.width = met.width
        this.height = met.height
    }

    redraw(gfx) {
        gfx.rect(this.x, this.y, this.width, this.height,
            gfx.theme_bg_color('label', 'green'))
        gfx.text(this.x, this.y, this.text,
            gfx.theme_text_color('label', 'yellow'))
    }
}

class Insets {
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
    }

    input(mouse, keyboard) {
        console.log("checking at",this.y, 'mous',mouse.y)
        if(!mouse.inside(this.x,this.y,this.width,this.height)) return false
        console.log("inside button. mouse down is",mouse.down)
        this.pressed = mouse.down
        if (this.pressed) this.fire('action', {})
        return true
    }

    layout(gfx) {
        let met = gfx.text_size(this.text)
        this.width = this.padding.left + met.width + this.padding.right
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
    input(mouse,keyboard) {
        super.input(mouse,keyboard)
        if(this.pressed) {
            this.selected = !this.selected
        }
    }
    redraw(gfx) {
        let name = 'button'
        // if(this.pressed) name = 'button:pressed'
        if(this.selected) name = 'button:selected'
        let bg = gfx.theme_bg_color(name,MAGENTA);
        let txt = gfx.theme_text_color(name,MAGENTA);
        gfx.rect(this.x, this.y, this.width, this.height, bg);
        gfx.text(this.padding.left + this.x, this.y, this.text, txt);

        // if (this.pressed) {
        //     gfx.rect(this.x, this.y, this.width, this.height,
        //         gfx.theme_bg_color('button:pressed', MAGENTA))
        //     gfx.text(this.padding.left + this.x, this.y, this.text,
        //         gfx.theme_text_color('button:pressed', MAGENTA))
        // } else {
        //     gfx.rect(this.x, this.y, this.width, this.height,
        //         gfx.theme_bg_color('button', 'magenta'))
        //     gfx.text(this.padding.left + this.x, this.y, this.text,
        //         gfx.theme_text_color('button', 'magenta'))
        // }

    }
}

export class TextBox extends Component {
    constructor(opts) {
        super(opts)
        this.text = opts.text || "textbox"
        this.padding = new Insets(5)
        this.cursor = 2
    }

    input(mouse, keyboard, win) {
        if(!mouse.inside(this.x, this.y, this.width, this.height)) return false
        if(mouse.down) win.set_focused(this)
        if(!win.is_focused(this)) return false
        if (win.is_focused(this)) {
            if (keyboard.keyname === 'Backspace') {
                if (this.text.length > 0) {
                    this.text = this.text.substring(0, this.text.length - 1)
                    let before = this.text.substring(0, this.cursor)
                    let after = this.text.substring(this.cursor)
                    this.text = before.substring(0, before.length - 1) + after
                    this.cursor = Math.max(this.cursor - 1, 0)
                }
            }
            if (keyboard.keyname === 'Space') {
                this.text = this.text + " "
                this.cursor += 1
            }
            if (keyboard.keyname === 'Left') {
                this.cursor = Math.max(this.cursor - 1, 0)
            }
            if (keyboard.keyname === 'Right') {
                this.cursor = Math.min(this.cursor + 1, this.text.length)
            }
            if (keyboard.keyname.length === 1) {
                // app.log(`keycode = ${keyboard.keyname} = ${keyboard.keyname.charCodeAt(0)}`)
                let ch = keyboard.keyname.charCodeAt(0)
                if (ch >= 65 && ch <= 90) {
                    this.text += String.fromCharCode(ch).toLowerCase()
                    this.cursor += 1
                }
            }
            if (keyboard.keyname === 'Return') {
                this.fire('action',{target:this})
            }
            keyboard.keyname = ""
        }
        return true
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

}

export class VBox extends Container {
    constructor(opts) {
        super(opts);
    }
    layout(gfx) {
        this.children.forEach(ch => ch.layout(gfx))
        let y = 0
        this.children.forEach(ch => {
            ch.x = 0
            ch.y = y
            y += ch.height
        })
    }
}
export class HBox extends Container {
    constructor(opts) {
        super(opts);
    }
    layout(gfx) {
        this.children.forEach(ch => ch.layout(gfx))
        let x = 0
        this.children.forEach(ch => {
            ch.x = x
            ch.y = 0
            x += ch.width
        })
    }

}