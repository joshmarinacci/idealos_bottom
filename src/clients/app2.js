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
    fill_rect(ws,10,5,'green')
}

ws.on('open',()=>{
    log("got the connection")
    draw_button(ws)
})
ws.on("message",(m)=>{
    log("got a message",JSON.parse(m))
})

setInterval(()=>{
    draw_button(ws)
},5000)
