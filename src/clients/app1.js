import {CommonApp} from "./app_utils.js"
import {DRAWING} from '../canvas/messages.js'

let app = new CommonApp(process.argv,10,5)

let x = 0
let y = 0

app.on('start',()=>{

    setInterval(()=>{
        app.send({type:'DRAW_PIXEL',x:x,y:y,color:'red'})
        x += 1
        if(x >= app.width) {
            x = 0
            y += 1
        }
    },5000)
})

app.on(DRAWING.REFRESH_WINDOW, ()=>{
    // for(let j=0; j<y; j++) {
        for (let i = 0; i < x; i++) {
            app.send({type: 'DRAW_PIXEL', x: i, y: y, color: 'red'})
        }
    // }
})







