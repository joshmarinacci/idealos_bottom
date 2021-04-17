import {make_message, SCHEMAS} from '../canvas/messages.js'
import {CommonApp} from './app_utils.js'

let width = 50
let height = 50

let app = new CommonApp(process.argv, width, height)


function redraw() {

}

app.on(SCHEMAS.WINDOW.REFRESH.NAME, () => {
    redraw()
})


function calc_pixel(count) {
    let x = count%width;
    let y = Math.floor(count/width)
    // for (var x = 0; x < 200; x++) {
    //     for (var y = 0; y < 200; y++) {
    let i = 0
    const cx = -2 + x / (width / 4)
    const cy = -2 + y / (width / 4)
    let zx = 0
    let zy = 0
    do {
        let xt = zx * zy
        zx = zx * zx - zy * zy + cx
        zy = 2 * xt + cy
        i++
    }
    while (i < 255 && (zx * zx + zy * zy) < 4)
    i = 255-i;
    let h = i.toString(16);
    let color_hex =  '#' + h + h + h
    // app.log('drawing',x,y,'=',i,'color =',color_hex)
    app.send(make_message(SCHEMAS.DRAW.PIXEL,{x:x, y:y, color: color_hex}))
}

function init() {
    app.log("starting the fractal")
    let count = 0
    let id = setInterval(() => {
        calc_pixel(count)
        count++
        if(count > width*height) clearInterval(id)
    }, 100)

}

app.on('start', () => init())