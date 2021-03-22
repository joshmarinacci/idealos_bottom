/*
connect to server
request window with size
every second, draw a pixel
 */


import {CommonApp} from "./app_utils.js"

let app = new CommonApp(process.argv,10,5)

app.on('start',()=>{
    let x = 0
    let y = 0

    setInterval(()=>{
        app.send({type:'DRAW_PIXEL',x:x,y:y,color:'red'})
        x += 1
        if(x >= app.width) {
            x = 0
            y += 1
        }
    },5000)
})






