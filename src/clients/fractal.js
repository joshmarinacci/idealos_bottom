import {CommonApp} from './app_utils.js'
import {WINDOWS} from 'idealos_schemas/js/windows.js'
import {GRAPHICS} from 'idealos_schemas/js/graphics.js'
import {MENUS} from 'idealos_schemas/js/menus.js'
import {INPUT} from 'idealos_schemas/js/input.js'

let width = 50
let height = 50
let buffer = new Array(width*height*4)
buffer.fill(0)

let app = new CommonApp(process.argv, width, height)

function redraw() {
}

app.on(WINDOWS.TYPE_window_refresh_request, ()=>{
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
    buffer[count*4+0] = i
    buffer[count*4+1] = i
    buffer[count*4+2] = i
    buffer[count*4+3] = 255
    // console.log(i)
    let color_hex =  '#' + h + h + h
    app.send(GRAPHICS.MAKE_DrawPixel({x:x, y:y, color: color_hex, window:app.win_id}))
}

let interval_id = -999

function refresh() {
    let msg =GRAPHICS.MAKE_DrawImage({
        window:app.win_id,
        x:0,
        y:0,
        width,
        height,
        pixels:buffer,
        depth:8,
        channels:4,
    })
    msg.depth = 8
    msg.channels = 4
    app.send(msg)
}

function init() {
    let count = 0
    let id = setInterval(() => {
        calc_pixel(count)
        count++
        if(count > width*height) clearInterval(id)
    }, 10)

}

function start() {
    if(interval_id !== -999) stop()
    app.log("starting")
    let count = 0
    interval_id = setInterval(() => {
        calc_pixel(count)
        count++
        if(count > width*height) clearInterval(interval_id)
    }, 10)
}

function stop() {
    app.log("stopping")
    clearInterval(interval_id)
    interval_id = -999
}

app.on('start', () => start())

app.on(WINDOWS.TYPE_window_close_request,(e) => {
    stop()
    app.a_shutdown().then(()=>console.log("done shutting down"))
})

app.on(WINDOWS.TYPE_window_refresh_request, () => {
    refresh()
})
app.on(WINDOWS.TYPE_SetFocusedWindow,()=>{
    let menu = {
        type:"root",
        children:[
            {
                type:'top',
                label:'Fractal',
                children:[
                    {
                        type:'item',
                        label:'Start',
                        command:'start'
                    },
                    {
                        type:'item',
                        label:'Stop',
                        command:'stop'
                    }
                ]
            },
        ]
    }
    app.send(MENUS.MAKE_SetMenubar({menu:menu}))
})

app.on(INPUT.TYPE_Action,(e) => {
    if (e.payload.command === 'stop') return stop()
    if (e.payload.command === 'start') return start()
})

