/*
connect to server
request window with size
every second, draw a pixel
 */

import {default as WebSocket} from "ws"
function log(...args) { console.log(...args) }

console.log("starting",process.argv)
let addr = process.argv[2]
log("connecting to",addr)
const ws = new WebSocket(addr);
ws.on('open',()=>{
    log("got the connection")
})
ws.on("message",(m)=>{
    log("got a message",JSON.parse(m))
})

let x = 0

setInterval(()=>{
    ws.send(JSON.stringify({type:'DRAW_PIXEL',x:x,y:0,color:'red'}))
    x += 1
    if(x > 20) x = 0
},5000)
