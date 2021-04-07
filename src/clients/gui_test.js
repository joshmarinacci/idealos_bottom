import {DRAW_PIXEL, DRAWING, FILL_RECT, MOUSE} from '../canvas/messages.js'
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
        if(this.y > x+h) return false
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
    app.log("redrawing gui test")
    //bg panel
    draw_rect(0,0,width,height,'white')
    label(1,1,"GUI Test","black")
    button(1,height/2,10,10, "ab")
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

const draw_rect = (x,y,width,height,color) => app.send({type:FILL_RECT.NAME, x, y, width, height, color})
const label = (x,y,text,color) => draw_text(x,y,text,color)
const button = (x,y,width,height,text) => {
    let bg = 'blue'
    if(mouse.inside(x,y,width,height) && mouse.down) bg = 'red'
    draw_rect(x,y,width,height,bg)
    draw_text(x+1,y+1,text,'black')
}

const draw_text = (x,y,text,color) => {
    font.draw_text(app,x,y,text,color);
}

/*
const font = {
    'a':[
        [0,0,0],
        [1,1,0],
        [1,0,1],
        [1,1,1]
    ],
    'b':[
        [1,0,0],
        [1,0,0],
        [1,1,1],
        [1,0,1],
        [1,1,1]
    ],
    'h':[
        [1,0,0],
        [1,1,1],
        [1,0,1],
    ],
    'i':[
        [1],
        [1],
        [1],
    ]
}
function draw_char(x, y, ch,color) {
    app.log("sending",x,ch)
    if(font[ch]) {
        let img = font[ch]
        for(let j=0; j<img.length; j++) {
            for (let i = 0; i < img[0].length; i++) {
                let px = img[j][i]
                if(px === 1) app.send({type:DRAW_PIXEL.NAME, x:x+i, y:y+j, color:color})
            }
        }
        x += img[0].length + 2
    }
    return x
}

function draw_text(x, y, txt,color) {
    for(let i=0; i<txt.length; i++) {
        let ch = txt[i]
        x = draw_char(x,y,ch,color)
    }
}
*/

app.on('start',()=>init())

