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
    redraw(gfx) {
        // gfx.rect(this.x,this.y,40,20,'green')
        gfx.text(this.x,this.y,this.text,'black')
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
    }
    redraw(gfx) {
        console.log("mouse is",mouse)
        this.pressed = mouse.inside(this.x,this.y,this.width,this.height) && mouse.down;
        if(this.pressed) {
            gfx.rect(this.x, this.y, this.width, this.height, 'black')
            gfx.text(this.x,this.y,this.text,'white')
        } else {
            gfx.rect(this.x, this.y, this.width, this.height, 'blue')
            gfx.text(this.x,this.y,this.text,'white')
        }
    }
}

function build_gui() {
    root = new Panel({width,height,children:[
            new Label({text:"label",x:0, width:20}),
            new Button({text:'button',x:0, y:30, width:30, height:15})
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
            app.send(make_message(SCHEMAS.DRAW.RECT, {x, y, width, height, color}))
        },
        text:(x,y,text,color) => {
            font.draw_text(app,x,y,text,color);
        }
    }
    app.log("redrawing gui test")
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

// const draw_rect = (x,y,width,height,color) => app.send(make_message(SCHEMAS.DRAW.RECT, {x, y, width, height, color}))
// const label = (x,y,text,color) => draw_text(x,y,text,color)
// const button = (x,y,width,height,text) => {
//     let bg = 'blue'
//     if(mouse.inside(x,y,width,height) && mouse.down) bg = 'red'
//     draw_rect(x,y,width,height,bg)
//     draw_text(x,y,text,'black')
// }

app.on('start',()=>init())

