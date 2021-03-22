import {FILL_RECT, MOUSE} from '../canvas/messages.js'
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
    app.send({type:FILL_RECT.NAME, x:0, y:0, width:w, height:h, color:color})
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
