/*
open window with specific size

wait 1 second
draw button
    rect bg using pixels
wait for input
    on any input, toggle the button state
on button change
    send new pixels to window
*/

import {default as WebSocket} from "ws"
function log(...args) { console.log(...args) }
let width = 10
let height = 5

console.log("starting",process.argv)
let addr = process.argv[2]
log("connecting to",addr)
const ws = new WebSocket(addr);

function fill_rect(ws,w,h,color) {
    for(let i=0; i<w; i++) {
        for(let j=0; j<h; j++) {
            ws.send(JSON.stringify({type:'DRAW_PIXEL',x:i,y:j,color:color}))
        }
    }
}

function draw_button(ws) {
    log("drawing a button")
    fill_rect(ws,width,height,'green')
}

ws.on('open',()=>{
    log("got the connection")
    ws.send(JSON.stringify({type:"OPEN_WINDOW",width:width, height:height}))
    setTimeout(()=> draw_button(ws),1000)
})
ws.on("message",(m)=>{
    log("got a message",JSON.parse(m))
})

