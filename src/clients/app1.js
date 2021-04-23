import {CommonApp} from "./app_utils.js"
import {make_message, SCHEMAS} from '../canvas/messages.js'
import {MENUS as WINDOWS} from "../schemas/windows_schemas.js"

let app = new CommonApp(process.argv,10,5)

let x = 0

app.on('start',()=>{

    setInterval(()=>{
        app.send(make_message(SCHEMAS.DRAW.PIXEL,{x,y:0,color:'red'}))
        x += 1
        if(x >= app.width) x = 0
    },5000)
})

app.on(WINDOWS.MAKE_window_refresh_request_name, ()=>{
    for (let i = 0; i < x; i++) {
        app.send(make_message(SCHEMAS.DRAW.PIXEL,{x:i,y:0,color:'red'}))
    }
})







