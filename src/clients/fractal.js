import {make_message, SCHEMAS} from '../canvas/messages.js'
import {CommonApp, PixelFont} from './app_utils.js'

let width = 50
let height = 50

let app = new CommonApp(process.argv,width,height)


function redraw() {

}

app.on(SCHEMAS.WINDOW.REFRESH.NAME, ()=>{
    redraw()
})


function calc_pixel(count) {
    let color = 'white'
    if(count % 2 === 0) {
        color = 'black'
    }
    let x = count%width;
    let y = Math.floor(count/width)
    app.log(`sending pixel ${color} at ${x},${y}`);
    app.send(make_message(SCHEMAS.DRAW.PIXEL,{x:x, y:y, color}))
}

function init() {
    app.log("starting the fractal")
    let count = 0
    let id = setInterval(()=>{
        calc_pixel(count)
        count++
    },1000)

}

app.on('start',()=>init())
