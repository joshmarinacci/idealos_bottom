import {make_message, SCHEMAS} from '../canvas/messages.js'
import {CommonApp, PixelFont} from './app_utils.js'

let width = 100
let height = 100
let app = new CommonApp(process.argv,width,height)
let mouse = {
    x:-1,
    y:-1,
    down:false,
    inside:function(x,y,w,h) {
        if(this.x < x) return false
        if(this.y < y) return false
        if(this.x > x+w) return false
        if(this.y > y+h) return false
        return true
    }
}
let keyboard = {
    keyname:""
}
let font = null
let root = null
app.theme = null
app.win = {
    width:100,
    height:100,
    input:() => {
        root.input(mouse,keyboard)
    },
    redraw:() => {
        let gfx = {
            rect:(x,y,width,height,color) => {
                return app.send(make_message(SCHEMAS.DRAW.RECT, {x, y, width, height, color}))
            },
            text:(x,y,text,color) => {
                return font.draw_text(app,x,y,text,color);
            },
            text_size:(text) => {
                return font.measure_text(app,text);
            }
        }
        // app.log("redrawing gui test")
        root.layout(gfx)
        root.redraw(gfx)
    }
}

function theme_bg_color(panel, def) {
    if(app.theme && app.theme[panel] && app.theme[panel].background_color) return app.theme[panel].background_color
    return def
}
function theme_border_color(panel, def) {
    if(app.theme && app.theme[panel] && app.theme[panel].border_color) return app.theme[panel].border_color
    return def
}
function theme_text_color(panel, def) {
    if(app.theme && app.theme[panel] && app.theme[panel].text_color) return app.theme[panel].text_color
    return def
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
    on(type,cb) {
        if(!this.listeners[type]) this.listeners[type] = []
        this.listeners[type].push(cb)
    }
    fire(type, payload) {
        if(!this.listeners[type]) this.listeners[type] = []
        this.listeners[type].forEach(cb => cb(payload))
    }
    input(mouse,keyboard) { }
    layout(gfx) { }
    find(query) {
        if(this.id === query.id) return this
    }
}

class Container extends Component {
    constructor(opts) {
        super(opts)
        this.children = opts.children || []
    }
    input(mouse,keyboard) {
        this.children.forEach(ch => ch.input(mouse,keyboard))
    }
    layout(gfx) {
        this.children.forEach(ch => ch.layout(gfx))
    }
    find(query) {
        if(this.id && this.id === query.id) {
            return this
        }
        for(let ch of this.children) {
            let ans = ch.find(query)
            if(ans) return ans
        }
        return null
    }
}

class Panel extends Container {
    constructor(opts) {
        super(opts)
    }
    redraw(gfx) {
        gfx.rect(this.x,this.y,this.width,this.height,theme_bg_color('panel','white'))
        this.children.forEach(ch => ch.redraw(gfx))
    }
}

class Label extends Component {
    constructor(opts) {
        super(opts)
        this.text = opts.text || "label"
    }
    layout(gfx) {
        let met = gfx.text_size(this.text)
        this.width = met.width;
        this.height = met.height;
    }
    redraw(gfx) {
        gfx.rect(this.x,this.y,this.width,this.height,
            theme_bg_color('label','green'))
        gfx.text(this.x,this.y,this.text,
            theme_text_color('label','yellow'))
    }
}

class Insets {
    constructor(m) {
        this.left = m;
        this.right = m;
        this.top = m;
        this.bottom = m;
    }
}

const MAGENTA = 'magenta'

class Button extends Component {
    constructor(opts) {
        super(opts)
        this.text = opts.text || "button"
        this.pressed = false
        this.padding = new Insets(5)
    }
    input(mouse,keyboard) {
        this.pressed = mouse.inside(this.x,this.y,this.width,this.height) && mouse.down;
        if(this.pressed) {
            this.fire('action',{})
        }
    }
    layout(gfx) {
        let met = gfx.text_size(this.text)
        this.width = this.padding.left + met.width + this.padding.right;
    }
    redraw(gfx) {
        if(this.pressed) {
            gfx.rect(this.x, this.y, this.width, this.height,
                theme_bg_color('button:pressed',MAGENTA))
            gfx.text(this.padding.left+this.x,this.y,this.text,
                theme_text_color('button:pressed',MAGENTA))
        } else {
            gfx.rect(this.x, this.y, this.width, this.height,
                theme_bg_color('button','magenta'))
            gfx.text(this.padding.left+this.x,this.y,this.text,
                theme_text_color('button','magenta'))
        }
    }

}

class TextBox extends Component {
    constructor(opts) {
        super(opts)
        this.text = opts.text || "hi"
        this.focused = false
        this.padding = new Insets(5)
        this.cursor = 2;
    }
    input(mouse,keyboard) {
        if(mouse.inside(this.x,this.y,this.width,this.height) && mouse.down) {
            this.focused = true;
        }
        if(this.focused) {
            if (keyboard.keyname === 'Backspace') {
                if(this.text.length > 0) {
                    this.text = this.text.substring(0, this.text.length - 1)
                    let before = this.text.substring(0,this.cursor)
                    let after = this.text.substring(this.cursor)
                    this.text = before.substring(0,before.length-1) + after
                    this.cursor = Math.max(this.cursor-1,0)
                }
            }
            if (keyboard.keyname === 'Space') {
                this.text = this.text + " "
                this.cursor += 1
            }
            if (keyboard.keyname === 'Left') {
                this.cursor = Math.max(this.cursor - 1,0)
            }
            if (keyboard.keyname === 'Right') {
                this.cursor = Math.min(this.cursor+1, this.text.length)
            }
            if(keyboard.keyname.length === 1) {
                // app.log(`keycode = ${keyboard.keyname} = ${keyboard.keyname.charCodeAt(0)}`)
                let ch = keyboard.keyname.charCodeAt(0)
                if(ch >= 65 && ch <= 90) {
                    this.text += String.fromCharCode(ch).toLowerCase()
                    this.cursor += 1
                }
            }
            keyboard.keyname = ""
        }
    }
    redraw(gfx) {
        let name = "textbox"
        if(this.focused) name = "textbox:focused"
        gfx.rect(this.x, this.y, this.width, this.height, theme_border_color(name,MAGENTA))
        gfx.rect(this.x+1, this.y+1, this.width-2, this.height-2, theme_bg_color(name,MAGENTA))
        gfx.text(this.padding.left+this.x,this.y,this.text,theme_text_color(name,MAGENTA))
        if(this.focused) {
            let before = this.text.substring(0,this.cursor)
            let before_metrics = gfx.text_size(before);
            gfx.rect(this.x+this.padding.left+before_metrics.width,this.y+2,1,this.height-4,theme_text_color(name,MAGENTA))
        }
    }

}

function build_gui() {
    root = new Panel({width,height,children:[
            new Label({text:"label",x:0, width:20}),
            new Button({text:'button',x:0, y:15, width:30, height:15, id:'button'}),
            new Label({text:'label',x:50, y:15, id:'button-target'}),
            new TextBox({text:"hi",y:50, width:60, height: 15}),
        ]})
    root.find({id:'button'}).on('action',()=>{
        root.find({id:'button-target'}).text = 'clicked!'
        app.win.redraw()
    })
}

async function init() {
    try {
        font = await PixelFont.load("src/clients/fonts/font.png", "src/clients/fonts/font.metrics.json")
        build_gui()
        app.win.redraw()
        app.send(make_message(SCHEMAS.RESOURCE.GET,{'resource':'theme','sender':app.appid}))
    } catch (e) {
        app.log(e)
    }
}



app.on(SCHEMAS.MOUSE.DOWN.NAME,(e)=>{
    mouse.x = e.payload.x
    mouse.y = e.payload.y
    mouse.down = true
    app.win.input()
    app.win.redraw()
})
app.on(SCHEMAS.MOUSE.UP.NAME,()=>{
    mouse.down = false
    app.win.input()
    app.win.redraw()
})
app.on(SCHEMAS.WINDOW.REFRESH.NAME, ()=>{
    app.win.redraw()
})
app.on(SCHEMAS.KEYBOARD.DOWN.NAME, (e)=>{
    // console.log("keyboard pressed in app",e)
    keyboard.keyname = e.payload.keyname;
    app.win.input()
    app.win.redraw();
})
app.on(SCHEMAS.RESOURCE.CHANGED.NAME, (e)=>{
    if(e.payload.resource === 'theme') {
        app.theme = JSON.parse(String.fromCharCode(...e.payload.data.data))
        app.win.redraw()
    }
})

app.on('start',()=>init())