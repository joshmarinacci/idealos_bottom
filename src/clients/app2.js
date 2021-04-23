import {make_message, SCHEMAS} from '../canvas/messages.js'
import {CommonApp} from './app_utils.js'
import {WINDOWS} from '../schemas/windows_schemas.js'

let app = new CommonApp(process.argv,10,5)
app.on('start',()=>{
    draw_button()
})
app.on(SCHEMAS.MOUSE.DOWN.NAME,()=>{
    draw_button_pressed()
})
app.on(SCHEMAS.MOUSE.UP.NAME,()=>{
    draw_button_released()
})
app.on(WINDOWS.MAKE_window_refresh_request_name, ()=>{
    draw_button_released()
})
function fill_rect(w,h,color) {
    app.send(make_message(SCHEMAS.DRAW.RECT,{x:0,y:0,width:w,height:h,color:color}))
}
function draw_button() {
    fill_rect(app.width,app.height,'green')
    draw_text(2,1,"hi",'black')
}

const font = {
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
    if(font[ch]) {
        let img = font[ch]
        for(let j=0; j<img.length; j++) {
            for (let i = 0; i < img[0].length; i++) {
                let px = img[j][i]
                if(px === 1) app.send(make_message(SCHEMAS.DRAW.PIXEL,{x:x+i, y:y+j, color}))
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

function draw_button_pressed() {
    fill_rect(app.width,app.height,'red')
    draw_text(2,1,"hi",'black')
}
function draw_button_released() {
    fill_rect(app.width,app.height,'green')
    draw_text(2,1,"hi",'black')
}
