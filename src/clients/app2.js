import {MOUSE} from '../canvas/messages.js'
import {CommonApp} from './app_utils.js'

let app = new CommonApp(process.argv,10,5)
app.on('start',()=>{
    draw_button()
})
app.on(MOUSE.DOWN.NAME,()=>{
    draw_button_pressed()
})
app.on(MOUSE.UP.NAME,()=>{
    draw_button_released()
})
function fill_rect(w,h,color) {
    for(let i=0; i<w; i++) {
        for(let j=0; j<h; j++) {
            app.send({type:'DRAW_PIXEL',x:i,y:j,color:color})
        }
    }
}
function draw_button() {
    fill_rect(app.width,app.height,'green')
}
function draw_button_pressed() {
    fill_rect(app.width,app.height,'aqua')
}
function draw_button_released() {
    fill_rect(app.width,app.height,'green')
}
