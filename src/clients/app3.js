import {DRAW_PIXEL, DRAWING, FILL_RECT, MOUSE} from '../canvas/messages.js'
import {CommonApp} from './app_utils.js'

let app = new CommonApp(process.argv,20,10)
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
app.on('start',()=>{
    redraw()
})
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

const rect = (x,y,width,height,color) => {
    app.send({type:FILL_RECT.NAME, x, y, width, height, color})
}
const text = (x,y,text,color) => {
    draw_text(x,y,text,color)
}
const button = (x,y,width,height,text) => {
    let bg = 'blue'
    if(mouse.inside(x,y,width,height) && mouse.down) {
        bg = 'red'
    }
    rect(x,y,width,height,bg)
    draw_text(x+1,y+1,text,'black')
}

function redraw() {
    rect(0,0,20,10,'green')
    text(3,1,"hi","black")
    button(13,1,10,10, "ab")
}

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