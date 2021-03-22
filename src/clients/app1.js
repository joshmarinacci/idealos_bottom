/*
connect to server
request window with size
every second, draw a pixel
 */

import {default as WebSocket} from "ws"
import {OPEN_WINDOW} from '../canvas/messages.js'

let width = 10
let height = 5
let win_id = null

function log(...args) { console.log(...args) }

log("starting",process.argv)
let addr = process.argv[2]
let appid = process.argv[3]
log("app",appid,"starting")
log("connecting to",addr)
const ws = new WebSocket(addr);

function start_drawing(ws) {
    let x = 0
    let y = 0

    setInterval(()=>{
        ws.send(JSON.stringify({type:'DRAW_PIXEL',x:x,y:y,color:'red', window:win_id}))
        x += 1
        if(x >= width) {
            x = 0
            y += 1
        }
    },5000)
}

ws.on('open',()=>{
    log("got the connection")
    ws.send(JSON.stringify({type:OPEN_WINDOW.NAME,width:width, height:height,sender:appid}))
    start_drawing(ws)
})
ws.on("message",(data)=>{
    let msg = JSON.parse(data)
    log("got a message",msg)
    if(msg.type === OPEN_WINDOW.RESPONSE_NAME) {
        log("our window id is",msg.window)
        win_id = msg.window
    }
})




