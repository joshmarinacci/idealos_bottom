import {CommonApp} from "./app_utils.js"
import {DRAWING} from '../canvas/messages.js'

let app = new CommonApp(process.argv,10,5)

let x = 0

app.on('start',()=>{

    setInterval(()=>{
        app.send({type:'DRAW_PIXEL',x:x,y:0,color:'red'})
        x += 1
        if(x >= app.width) x = 0
    },5000)
})

app.on(DRAWING.REFRESH_WINDOW, ()=>{
    for (let i = 0; i < x; i++) {
        app.send({type: 'DRAW_PIXEL', x: i, y: 0, color: 'red'})
    }
})







