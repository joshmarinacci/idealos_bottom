import {CommonApp} from "./app_utils.js"
import {WINDOWS} from "idealos_schemas/js/windows.js"
import {GRAPHICS} from 'idealos_schemas/js/graphics.js'

let app = new CommonApp(process.argv,10,5)

let x = 0

app.on('start',()=>{

    setInterval(()=>{
        app.send(GRAPHICS.MAKE_DrawPixel({x,y:0,color:'red', window:app.win_id}))
        x += 1
        if(x >= app.width) x = 0
    },5000)
})

app.on(WINDOWS.TYPE_window_refresh_request, ()=>{
    for (let i = 0; i < x; i++) {
        app.send(GRAPHICS.MAKE_DrawPixel({x:i,y:0,color:'red', window:app.win_id}))
    }
})







