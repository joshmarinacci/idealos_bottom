import {WINDOWS} from 'idealos_schemas/js/windows.js'
import {RESOURCES} from 'idealos_schemas/js/resources.js'
import {INPUT} from 'idealos_schemas/js/input.js'
import {GRAPHICS} from 'idealos_schemas/js/graphics.js'
import {default as WebSocket} from 'ws'

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
    position() {
        return new Point(this.x,this.y)
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


export class JoshFont {
    constructor(info) {
        this.info = info
    }

    draw_text(app,x,y,text,color,win) {
        let dx = 0
        let codepoints = [...text]
        for(let i=0; i<codepoints.length; i++) {
            let cp = text.codePointAt(i)
            if(cp === 0xde00) continue //skip astral plane indicators
            let g = this.find_glyph_by_id(cp)
            let bitmap = this.get_bitmap_for_glyph(g)
            let msg = GRAPHICS.MAKE_DrawImage({
                x:x+dx-g.left,
                y:y-g.baseline+g.height,
                width:g.width,
                height:g.height,
                pixels:bitmap,
                window:win._winid,
            })
            msg.depth=1
            msg.channels = 4
            msg.color = color
            app.send(msg)
            dx += (g.width-g.left-g.right)
        }
    }
    measure_text(app,text) {
        let dx = 0
        let my = 0
        let codepoints = [...text]
        for(let i=0; i<codepoints.length; i++) {
            let cp = text.codePointAt(i)
            if(cp === 0xde00) continue //skip astral plane indicators
            let g = this.find_glyph_by_id(cp)
            dx += g.width - g.left - g.right
            my = Math.max(my,g.height)
        }
        return {
            width:dx,
            height:my,
        }
    }

    find_glyph_by_id(id) {
        let g = this.info.glyphs.find(g => g.id === id)
        if(!g) {
            console.log("missing glyph for codepoint",id)
            if(this.info.name === 'emoji') {
                return this.find_glyph_by_id(128512)
            } else {
                return this.find_glyph_by_id(27)
            }
        }
        return g
    }

    get_bitmap_for_glyph(a_glyph) {
        if(a_glyph.image) return a_glyph.image
        // console.log("generating image for ",a_glyph.name)
        a_glyph.image = new Array(a_glyph.width*a_glyph.height*4)
        a_glyph.image.fill(0)
        for(let i=0; i<a_glyph.width; i++) {
            for(let j=0; j<a_glyph.height; j++) {
                let c = a_glyph.data[j*a_glyph.width+i]
                let n = (j*a_glyph.width + i)*4
                // a_glyph.image[n + 0] = 0
                // a_glyph.image[n + 1] = 0
                // a_glyph.image[n + 2] = 0
                if(c) {
                    a_glyph.image[n + 3] = 255
                } else {
                    a_glyph.image[n + 3] = 0
                }
            }
        }
        return a_glyph.image
    }
}

export class App {
    constructor(argv) {
        this._appid = argv[3]
        this.ws = new WebSocket(argv[2]);
        this.listeners = {}
        this.listeners['ALL'] = []
        this.listeners['PENDING_RESPONSE'] = []
        this.windows = []
        this._started = false
        this.ws.on('open', () => {
            this._started = true
            this.send({
                type:"APP_OPEN",
                app_type:"CLIENT",
                app:this._appid
            })
            this.send_and_wait_for_response({
                type: "request-font",
                name: 'base',
            }).then(r  => {
                if (r.succeeded) {
                    this.base_font = new JoshFont(r.font)
                } else {
                    this.log("warning. no font loaded")
                }
            })
            this.fireLater('start', {})
        })
        this.ws.on("message", (data) => {
            let msg = JSON.parse(data)
            // this.log("incoming message",msg)
            this.fireLater(msg.type, msg)
        })
        process.on('SIGTERM', () => {
            console.log(`Received SIGTERM in app ${this._appid} `);
            this.a_shutdown().then("done shutting down")
        });
        this._theme = null

        this.on("theme-changed",()=>{
            this.windows.forEach(win => win.theme_changed())
        })
        this.on('translation_language_changed',() => {
            this.windows.forEach(win => win.translation_changed())
        })
        this.on('font-update',() => {
            this.windows.forEach(win => win.font_changed())
        })
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
    a_init() {
        return new Promise((res,rej)=>{
            if(this._started) return res()
            this.on('start',res)
        })
    }
    open_window(x,y,width,height,window_type) {
        return new Promise((res,rej)=>{
            this.send(WINDOWS.MAKE_WindowOpen({
                x:50,
                y:50,
                width: width,
                height: height,
                sender: this._appid,
                window_type: window_type
            }))
            let handler = (e) => {
                this.off(WINDOWS.TYPE_WindowOpenResponse,handler)
                let win = new Window(this,width,height,e.payload.window,null,false)
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
    on_all(cb) {
        this.listeners['ALL'].push(cb)
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
            this.listeners["ALL"].forEach(cb => cb(evt))
            if(payload.response_to) this.listeners["PENDING_RESPONSE"].forEach(cb => cb(evt))
        },1)
    }
    send(msg) {
        msg.app = this._appid
        // this.log("app sending out",msg)
        this.ws.send(JSON.stringify(msg))
    }
    send_with_trigger(msg,trigger) {
        if(trigger && trigger.id) {
            msg.trigger = trigger.id
        }
        this.send(msg)
    }
    wait_for_response(id) {
        return new Promise((res,rej) => {
            let handler = (msg) => {
                if(msg.payload.response_to === id) {
                    setTimeout(()=>{
                        this.listeners['PENDING_RESPONSE'] =
                            this.listeners['PENDING_RESPONSE'].filter(cb => cb !== handler)
                    },1)
                    res(msg.payload)
                }
            }
            this.listeners['PENDING_RESPONSE'].push(handler)
        })
    }
    send_and_wait_for_response(msg) {
        if(!msg.id) msg.id = "msg_"+Math.floor((Math.random()*10000))
        this.send(msg)
        return this.wait_for_response(msg.id)
    }
}

class EventDispatcher {
    constructor(win) {
        this.window = win
        this.keyboard_target = null
        this.mouse_target = null
    }

    dispatch(e) {
        //this.log("dispatching",e)
        if (e.type === INPUT.TYPE_MouseDown) {
            let evt = {
                type:e.type,
                pos: new Point(Math.floor(e.x),Math.floor(e.y)),
                id:e.id?e.id:0,
            }
            return this.dispatch_mousedown(evt,this.window.root)
        }
        if (e.type === INPUT.TYPE_MouseUp) {
            let evt = {
                type:e.type,
                pos: new Point(Math.floor(e.x),Math.floor(e.y)),
                id:e.id?e.id:0,
            }
            return this.dispatch_mouseup(evt,this.window.root)
        }
        if(e.type === INPUT.TYPE_KeyboardDown) {
            return this.dispatch_keydown(e,this.window.root)
        }
        if(e.type === INPUT.TYPE_Action) {
            return this.dispatch_action(e,this.window.root)
        }
    }

    dispatch_mousedown(evt,node) {
        this.log("dispatch mousedown",evt.type)
        if(!node) return console.warn("WARNING: no root inside window")
        // console.log(`down`,evt.pos,node.constructor.name, node.children.length)
        for (let ch of node.children) {
            // console.log('mousedown inside?',ch.constructor.name,ch.bounds(),evt.pos,ch.bounds().contains(evt.pos))
            if(!ch.visible) continue
            if(ch.bounds().contains(evt.pos)) {
                // node.window().log("inside child!")
                // if(ch.text) node.window().log("text",ch.text)
                return this.dispatch_mousedown({
                    type:evt.type,
                    pos: ch.bounds().translate_into(evt.pos),
                    id:evt.id,
                },ch)
            }
        }
        this.mouse_target = node
        this.keyboard_target = node
        this.window.set_focused(node)
        // this.log("mousedown sent to",node.dump())
        while(node !== undefined && node._type !== 'window') {
            let ret = node.input(evt)
            if(ret) break
            // this.log("not consumed. going up to the parent")
            node = node.parent
        }
    }

    dispatch_mouseup(evt,node) {
        this.log("dispatch mouseup",evt.type)
        if(this.mouse_target) {
            // this.window.log("sending mouseup to mouse_target",this.mouse_target.constructor.name)
            this.mouse_target.input(evt)
            this.mouse_target = null
        }
    }

    dispatch_keydown(evt, root) {
        this.log("dispatch keydown",evt.type)
        if(!this.keyboard_target) return console.error("no keyboard target")
        this.keyboard_target.input(evt)
    }

    dispatch_action(evt,root) {
        this.log("dispatch action",evt.type)
        if(!this.keyboard_target) return console.error("no keyboard action target")
        this.keyboard_target.input(evt)
    }

    log(...args) {
        // console.log("EVENT_DISPATCHER",...args)
    }
}

export class Window {
    constructor(app, width,height,id,parent=null,is_child=false) {
        this._type = 'window'
        this.child_windows = []
        this.app = app
        this._winid = id
        this.x = -1
        this.y = -1
        this.width = width
        this.height = height
        this.root = null
        this.focused = null
        this.is_child = is_child
        this.parent = parent
        if(this.parent) {
            this.parent.child_windows.push(this)
        }
        this.dispatcher = new EventDispatcher(this)
        app.on(INPUT.TYPE_MouseDown,(e)=>{
            if(e.payload.window !== this._winid) return
            this.dispatcher.dispatch(e.payload)
        })
        app.on(INPUT.TYPE_MouseMove,(e)=>{
            if(e.payload.window !== this._winid) return
            this.dispatcher.dispatch(e.payload)
        })
        app.on("WINDOW_FOCUS_LOST",()=>{
            this.lost_window_focus()
        })

        app.on(INPUT.TYPE_MouseUp,(e)=>{
            if(e.payload.window !== this._winid) return
            this.dispatcher.dispatch(e.payload)
        })
        app.on(INPUT.TYPE_Action,(e)=>{
            if(e.payload.window !== this._winid) return
            // console.log("sending action",e.payload)
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
        app.on(WINDOWS.TYPE_WindowSetPosition, (e)=>{
            if(e.payload.window !== this._winid) return
            this.x = e.payload.x
            this.y = e.payload.y
        })
        app.on('window-set-size', (e)=>{
            if(e.payload.window !== this._winid) return
            this.width = e.payload.width
            this.height = e.payload.height
            this.redraw(e)
        })
    }
    repaint(trigger) {
        // console.log("repainting window", this.x,this.y,this.width,this.height)
        this.redraw(trigger)
    }
    redraw(trigger) {
        if(!this.root) return
        if(!this.app.base_font) {
            this.app.log("no base font yet!")
            return
        }
        this.root.parent = this
        let gfx = new Gfx(this.app,this,trigger)
        this.root.layout(gfx)
        this.root.redraw(gfx)
        this.app.send({
            type: 'group-message',
            category:"graphics",
            messages: gfx.messages,
        })
        this.app.send_with_trigger(GRAPHICS.MAKE_DrawRect({
            x:0, y:0, width:1, height:1, color:'red', window:this._winid}),trigger)
    }
    is_focused(el) {
        if(this.focused && this.focused === el) return true
        return false
    }
    set_focused(el) {
        this.focused = el
        this.child_windows.forEach(ch => ch.close())
    }
    lost_window_focus() {
        this.child_windows.forEach(ch => ch.close())
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
    position_in_window() {
        return new Point(0,0)
    }
    log(...args) {
        this.app.log(...args)
    }
    send(msg) {
        this.app.send(msg)
    }
    theme_changed() {
        this.root.theme_changed()
        this.repaint()
    }
    translation_changed() {
        this.root.translation_changed()
        this.repaint()
    }
    font_changed() {
        this.redraw()
    }
    async send_and_wait(msg) {
        msg.id = "msg_"+Math.floor((Math.random()*10000))
        this.app.send(msg)
        return await this.app.wait_for_response(msg.id)
    }
}

class Gfx {
    constructor(app,win,trigger) {
        this.app = app
        this.win = win
        this.tx = 0
        this.ty = 0
        this.trigger = trigger
        this.messages = []
        this.clip_rect = {x:0,y:0,width:1000,height:1000}
    }
    translate(x,y) {
        this.tx += x
        this.ty += y
    }
    set_clip_rect(x, y, width, height) {
        this.clip_rect = {x:x+this.tx,y:y+this.ty, width, height}
    }
    clear_clip_rect() {
        this.clip_rect = {x:0,y:0,width:1000,height:1000}
    }
    rect(x,y,width,height,color) {
        if(color === 'transparent') return
        let bounds  = {
            x: this.tx + x,
            y: this.ty + y,
            width, height, color, window: this.win._winid }
        let clip = {
            x:this.clip_rect.x,
            y:this.clip_rect.y,
            width:this.clip_rect.width,
            height: this.clip_rect.height
        }
        if(this.clip_rect.width !== 1000) {
            // this.win.log("drawing rect with clip rect", clip)
            // this.win.log("bounds",bounds)
            if(bounds.y+bounds.height < clip.y ) return
            if(bounds.y > clip.y + clip.height) return
            if(bounds.x+bounds.width > clip.x + clip.width ) {
                bounds.width = clip.x + clip.width - bounds.x
            }
            if(bounds.y+bounds.height > clip.y + clip.height) {
                bounds.height = clip.y + clip.height - bounds.y
            }
            if(bounds.x < clip.x) {
                let diff = clip.x - bounds.x
                bounds.x += diff
                bounds.width -= diff
            }
            if(bounds.y < clip.y) {
                let diff = clip.y - bounds.y
                bounds.y += diff
                bounds.height -= diff
            }
            // this.win.log("final",bounds)
        }
        this.send(GRAPHICS.MAKE_DrawRect(bounds))
    }

    send(msg) {
        this.messages.push(msg)
    }
    text(x,y,text,color,font) {
        if(this.clip_rect.width !== 1000) {
            let clip = {
                x: this.clip_rect.x,
                y: this.clip_rect.y,
                width: this.clip_rect.width,
                height: this.clip_rect.height
            }
            if(this.ty + y < clip.y) return
            if(this.ty + y > clip.y + clip.height) return
        }

        if (font) return font.draw_text(this, this.tx + x, this.ty + y, text, color, this.win)
        return this.win.app.base_font.draw_text(this, this.tx + x, this.ty + y, text, color, this.win)
    }
    font() {
        return this.win.app.base_font
    }
    text_size(text, font) {
        if(font) return font.measure_text(this.app,text)
        return this.win.app.base_font.measure_text(this.app,text)
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
        if(!opts) opts = {}
        this.name = "unnamed component"
        this.id = opts.id || ""
        this.x = opts.x || 0
        this.y = opts.y || 0
        this.width = opts.width || 10
        this.height = opts.height || 10
        this.listeners = {}
        this.children = []
        this.font = opts.font || null
        this.visible = true
        this.flex = opts.flex || 0
        if(opts.hasOwnProperty('visible')) this.visible = opts.visible
    }

    bounds() {
        return new Bounds(this.x,this.y,this.width,this.height)
    }
    position_in_window() {
        return this.parent.position_in_window().add(this.bounds().position())
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
    repaint(trigger) {
        // console.log(this.constructor.name,"requesting a repaint")
        if(this.parent && this.parent.repaint) this.parent.repaint(trigger)
    }
    window() {
        return this.parent.window()
    }

    lookup_theme_part(name, state) {
        if(!this.name)throw new Error("component has no name")
        if (!this.theme && !this.theme_loading) {
            this.theme_loading = true
            this.window().send_and_wait({
                type: "get_control_theme",
                name: this.name,
                style: "plain",
                state: "normal"
            }).then((msg)=>{
                this.theme = msg.theme
                this.theme_loading = false
                this.repaint()
            })
            return 'black'
        }
        if (!this.theme && this.theme_loading) {
            return 'black'
        }
        // console.log("using theme",this.theme,name,state,this.theme.states)
        if (state && this.theme.states) {
            // console.log("checking out state",this.name,state,name,this.theme)
            if (this.theme.states[state]) {
                if(this.theme.states[state][name]) {
                    return this.theme.states[state][name]
                }
            }
        }
        return this.theme[name]
    }
    theme_changed() {
        this.theme = null
    }

    lookup_translated_text(key) {
        if(!this._translations) this._translations = {}
        if(this._translations[key]) {
            return this._translations[key]
        }
        if(this.translation_loading) return "-----"
        // console.log('starting to load')
        this.translation_loading = true
        this.window().send_and_wait({
            type: "translation_get_value",
            key: key,
        }).then((msg)=>{
            // console.log("got the response back")
            this._translations[key] = msg.value
            this.translation_loading = false
            this.repaint()
        })
        return "-*---"
    }
    translation_changed() {
        this._translations = {}
    }
    dump() {
        return {
            name:this.name,
            id:this.id,
            flex:this.flex,
            bounds:{
                x:this.x,
                y:this.y,
                width:this.width,
                height:this.height,
            },
            children:this.children.map(ch => {
                if(ch.dump) return ch.dump()
                return "missing dump"
            })
        }
    }
}

export class Container extends Component {
    constructor(opts) {
        super(opts)
        if(!opts) opts = {}
        this.children = []
        if(opts.hasOwnProperty('children')) this.children = opts.children.slice()
        this.children.forEach(ch => ch.parent = this)
    }

    input(e) {
    }

    layout(gfx) {
        this.children.forEach(ch => ch.layout(gfx))
    }

    redraw(gfx) {
        // this.window().log("drawing",this.constructor.name,this.x,this.y,this.width,this.height)
        gfx.translate(this.x,this.y)
        this.children.forEach(ch => {
            if(ch.visible) ch.redraw(gfx)
        })
        gfx.translate(-this.x,-this.y)
    }
    theme_changed() {
        super.theme_changed()
        this.children.forEach(ch => ch.theme_changed())
    }
    translation_changed() {
        super.translation_changed()
        this.children.forEach(ch => ch.translation_changed())
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

export const MAGENTA = 'magenta'


