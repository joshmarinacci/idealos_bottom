import {CommonApp} from "./app_utils.js"
import {WINDOWS} from "idealos_schemas/js/windows.js"
import {GRAPHICS} from 'idealos_schemas/js/graphics.js'
import {MENUS} from 'idealos_schemas/js/menus.js'

let app = new CommonApp(process.argv,60,20)

let min = 0
let sec = 0
let interval_id = -1

function tick() {
    sec++
    if(sec >= 60) {
        min++
        sec = 0
    }
    draw()
}
function draw() {
    app.send(GRAPHICS.MAKE_DrawRect({x:0,y:0,width:sec,height:9,color:'red', window:app.win_id}))
    app.send(GRAPHICS.MAKE_DrawRect({x:0,y:10,width:min,height:9,color:'green', window:app.win_id}))
}
app.on('start',()=>{
    interval_id = setInterval(tick,1000)
})

app.on(WINDOWS.TYPE_window_refresh_request, ()=>{
    draw()
})

app.on(WINDOWS.TYPE_SetFocusedWindow, ()=>{
    let menu = {
        type:"root",
        children:[
            {
                type:'top',
                label:'Clock',
                children:[]
            }
        ]
    }
    let msg =  MENUS.MAKE_SetMenubar({menu:menu})
    app.send(msg)
})

app.on(WINDOWS.TYPE_window_close_request,(e) => {
    clearInterval(interval_id)
    app.a_shutdown().then(()=>console.log("finished"))
})







