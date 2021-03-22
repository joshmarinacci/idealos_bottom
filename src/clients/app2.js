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
import {MOUSE, OPEN_WINDOW} from '../canvas/messages.js'
function log(...args) { console.log(...args) }
let width = 10
let height = 5
let win_id = null

log("starting",process.argv)
let addr = process.argv[2]
let appid = process.argv[3]
log("app",appid,"starting")
log("connecting to",addr)
const ws = new WebSocket(addr);

function fill_rect(ws,w,h,color) {
    for(let i=0; i<w; i++) {
        for(let j=0; j<h; j++) {
            ws.send(JSON.stringify({type:'DRAW_PIXEL',x:i,y:j,color:color, window:win_id}))
        }
    }
}

function draw_button(ws) {
    fill_rect(ws,width,height,'green')
}
function draw_button_pressed(ws) {
    fill_rect(ws,width,height,'aqua')
}
function draw_button_released(ws) {
    fill_rect(ws,width,height,'green')
}

ws.on('open',()=>{
    log("got the connection")
    ws.send(JSON.stringify({type:OPEN_WINDOW.NAME,width:width, height:height, sender:appid}))
    setTimeout(()=> draw_button(ws),1000)
})
ws.on("message",(data)=>{
    let msg = JSON.parse(data)
    if(msg.type === OPEN_WINDOW.RESPONSE_NAME) {
        log("our window id is",msg.window)
        win_id = msg.window
    }
    if(msg.type === MOUSE.DOWN.NAME) {
        return draw_button_pressed(ws)
    }
    if(msg.type === MOUSE.UP.NAME) {
        return draw_button_released(ws)
    }
    log("got a message",msg)

})

