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

class Panel {
    constructor(opts) {
        this.x = opts.x || 0
        this.y = opts.y || 0
        this.width = opts.width || 10
        this.height = opts.height || 10
        this.children = opts.children || []
    }
    layout(gfx) {
        this.children.forEach(ch => ch.layout(gfx))
    }
    redraw(gfx) {
        gfx.rect(this.x,this.y,this.width,this.height,'white')
        this.children.forEach(ch => ch.redraw(gfx))
    }
}

class Label {
    constructor(opts) {
        this.x = opts.x || 0
        this.y = opts.y || 0
        this.width = opts.width || 10
        this.height = opts.height || 10
        this.text = opts.text || "hi"
    }
    layout(gfx) {
        let met = gfx.text_size(this.text)
        this.width = met.width;
        this.height = met.height;
    }
    redraw(gfx) {
        gfx.rect(this.x,this.y,this.width,this.height,'green')
        gfx.text(this.x,this.y,this.text,'black')
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

class Button {
    constructor(opts) {
        this.x = opts.x || 0
        this.y = opts.y || 0
        this.width = opts.width || 10
        this.height = opts.height || 10
        this.text = opts.text || "hi"
        this.pressed = false
        this.padding = new Insets(5)
    }
    layout(gfx) {
        let met = gfx.text_size(this.text)
        this.width = this.padding.left + met.width + this.padding.right;
    }
    redraw(gfx) {
        this.pressed = mouse.inside(this.x,this.y,this.width,this.height) && mouse.down;
        if(this.pressed) {
            gfx.rect(this.x, this.y, this.width, this.height, 'black')
            gfx.text(this.padding.left+this.x,this.y,this.text,'white')
        } else {
            gfx.rect(this.x, this.y, this.width, this.height, 'blue')
            gfx.text(this.padding.left+this.x,this.y,this.text,'white')
        }
    }
}

class TextBox {
    constructor(opts) {
        this.x = opts.x || 0
        this.y = opts.y || 0
        this.width = opts.width || 10
        this.height = opts.height || 10
        this.text = opts.text || "hi"
        this.focused = false
        this.padding = new Insets(5)
        this.cursor = 2;
    }
    layout(gfx) {
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
        gfx.rect(this.x, this.y, this.width, this.height, this.focused?'yellow':'blue')
        gfx.text(this.padding.left+this.x,this.y,this.text,'black')
        if(this.focused) {
            let before = this.text.substring(0,this.cursor)
            let before_metrics = gfx.text_size(before);
            gfx.rect(this.x+this.padding.left+before_metrics.width,this.y,1,this.height,'black')
        }
    }

}

function build_gui() {
    root = new Panel({width,height,children:[
            new Label({text:"label",x:0, width:20}),
            new Button({text:'button',x:0, y:30, width:30, height:15}),
            new TextBox({text:"hi",y:50, width:60, height: 15}),
        ]})
}

async function init() {
    try {
        font = await PixelFont.load("src/clients/fonts/font.png", "src/clients/fonts/font.metrics.json")
        build_gui()
        redraw()
    } catch (e) {
        app.log(e)
    }
}
function redraw() {
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



app.on(SCHEMAS.MOUSE.DOWN.NAME,(e)=>{
    mouse.x = e.payload.x
    mouse.y = e.payload.y
    mouse.down = true
    redraw()
})
app.on(SCHEMAS.MOUSE.UP.NAME,()=>{
    mouse.down = false
    redraw()
})
app.on(SCHEMAS.WINDOW.REFRESH.NAME, ()=>{
    redraw()
})
app.on(SCHEMAS.KEYBOARD.DOWN.NAME, (e)=>{
    // console.log("keyboard pressed in app",e)
    keyboard.keyname = e.payload.keyname;
    redraw();
})

// const draw_rect = (x,y,width,height,color) => app.send(make_message(SCHEMAS.DRAW.RECT, {x, y, width, height, color}))
// const label = (x,y,text,color) => draw_text(x,y,text,color)
// const button = (x,y,width,height,text) => {
//     let bg = 'blue'
//     if(mouse.inside(x,y,width,height) && mouse.down) bg = 'red'
//     draw_rect(x,y,width,height,bg)
//     draw_text(x,y,text,'black')
// }

app.on('start',()=>init())

