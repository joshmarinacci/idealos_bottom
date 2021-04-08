import {DRAWING, make_message, MOUSE, SCHEMAS} from '../canvas/messages.js'
import {CommonApp, PixelFont} from './app_utils.js'

let width = 40
let height = 30
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

async function init() {
    try {
        font = await PixelFont.load("src/clients/fonts/font.png", "src/clients/fonts/font.metrics.json")
        redraw()
    } catch (e) {
        app.log(e)
    }
}
function redraw() {
    //bg panel
    draw_rect(0,0,width,height,'white')
    // label(1,1,"G","black")
    button(1,4,25,10, "hello")
}



app.on(MOUSE.DOWN.NAME,(e)=>{
    console.log("mouse down",e)
    mouse.x = e.payload.x
    mouse.y = e.payload.y
    mouse.down = true
    redraw()
})
app.on(MOUSE.UP.NAME,()=>{
    mouse.down = false
    redraw()
})
app.on(DRAWING.REFRESH_WINDOW, ()=>{
    redraw()
})

const draw_rect = (x,y,width,height,color) => app.send(make_message(SCHEMAS.DRAW.RECT, {x, y, width, height, color}))
const label = (x,y,text,color) => draw_text(x,y,text,color)
const button = (x,y,width,height,text) => {
    let bg = 'blue'
    if(mouse.inside(x,y,width,height) && mouse.down) bg = 'red'
    draw_rect(x,y,width,height,bg)
    draw_text(x+1,y+height,text,'black')
}

const draw_text = (x,y,text,color) => {
    font.draw_text(app,x,y,text,color);
}
app.on('start',()=>init())

