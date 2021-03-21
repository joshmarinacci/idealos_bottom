/*
connect to server
request window with size
every second, draw a pixel
 */

import {default as WebSocket} from "ws"

let width = 10
let height = 10

function log(...args) { console.log(...args) }

log("starting",process.argv)
let addr = process.argv[2]
log("connecting to",addr)
const ws = new WebSocket(addr);

function start_drawing(ws) {
    let x = 0
    let y = 0

    setInterval(()=>{
        ws.send(JSON.stringify({type:'DRAW_PIXEL',x:x,y:y,color:'red'}))
        x += 1
        if(x >= width) {
            x = 0
            y += 1
        }
    },5000)
}

ws.on('open',()=>{
    log("got the connection")
    ws.send(JSON.stringify({type:"OPEN_WINDOW",width:width, height:height}))
    start_drawing(ws)

})
ws.on("message",(m)=>{
    // log("got a message",JSON.parse(m))
})




