/*

wait for page to load
open connection to server
show status of connection on screen
process drawing events by drawing
process input events by sending to server
 */
import {DRAW_PIXEL, FILL_RECT, HEARTBEAT, MOUSE, OPEN_WINDOW} from "./messages.js"

const $ = (sel) => document.querySelector(sel)
const on = (elm, type, cb) => elm.addEventListener(type,cb)

const scale = 20


$("#status").innerText = "disconnected"

function log(...args) { console.log(...args) }

function mouseevent_to_pixels(e) {
    let rect = e.target.getBoundingClientRect()
    return {x:Math.floor((e.clientX-rect.x)/scale),y:Math.floor((e.clientY-rect.y)/scale)}
}

function send_heartbeat(ws) {
    ws.send(JSON.stringify({type:HEARTBEAT.NAME}))
}

const windows = {}

function find_window(pt) {
    return Object.values(windows).find(win => {
        if(pt.x < win.x) return false
        if(pt.x > win.x + win.width) return false
        if(pt.y < win.y) return false
        if(pt.y > win.y + win.height) return false
        // log("inside window!",pt,win)
        return true
    })
}

function handle_drawing(msg, windows) {
    if(!windows[msg.window]) {
        log("no such window",msg.window)
        return
    }
    let win = windows[msg.window]
    let c = $('#canvas').getContext('2d')
    if(msg.type === DRAW_PIXEL.NAME) {
        c.fillStyle = msg.color
        c.fillRect(win.x * scale + msg.x * scale,
            win.y * scale + msg.y * scale,
            1 * scale * 0.9,
            1 * scale * 0.9)
    }
    if(msg.type === FILL_RECT.NAME) {
        c.fillStyle = msg.color
        for(let i=0; i<msg.width; i++) {
            for(let j=0; j<msg.height; j++) {
                c.fillRect(
                    (win.x + msg.x + i)* scale,
                    (win.y + msg.y + j) * scale,
                    (1) * scale * 0.9,
                    (1)* scale * 0.9
                )
            }
        }
    }

    //draw window border
    // log('drawing window border',win)
    for(let x = -1; x<win.width+1; x++) {
        c.fillStyle = 'yellow'
        c.fillRect(
            (win.x + x)* scale,
            (win.y + -1) * scale,
            (1) * scale * 0.9,
            (1)* scale * 0.9
        )
        c.fillRect(
            (win.x + x)* scale,
            (win.y + win.height) * scale,
            (1) * scale * 0.9,
            (1)* scale * 0.9
        )
    }
    for(let y=-1; y<win.height; y++) {
        c.fillStyle = 'yellow'
        c.fillRect(
            (win.x + -1)* scale,
            (win.y + y) * scale,
            (1) * scale * 0.9,
            (1)* scale * 0.9
        )
        c.fillRect(
            (win.x + win.width)* scale,
            (win.y + y) * scale,
            (1) * scale * 0.9,
            (1)* scale * 0.9
        )
    }
}

on(window,'load',() =>{
    log("the page is loaded")
    let socket = new WebSocket("ws://localhost:8081")
    on(socket,'open',()=>{
        log("connected to the server")
        $("#status").innerText = "connected"
        socket.send(JSON.stringify({type:"START",kind:'SCREEN'}))
    })
    on(socket,'error',(e)=> log("error",e))
    on(socket, 'close',(e)=>{
        log("closed",e)
        $("#status").innerText = "disconnected"
    })

    on(socket,'message',(e)=>{
        let msg = JSON.parse(e.data)
        if(msg.type === DRAW_PIXEL.NAME) return handle_drawing(msg,windows);
        if(msg.type === FILL_RECT.NAME) return handle_drawing(msg,windows);
        if(msg.type === OPEN_WINDOW.NAME) {
            let win_id = "id_"+Math.floor(Math.random()*10000)
            let y = Object.keys(windows).length
            windows[win_id] = {
                id:win_id,
                width:msg.width,
                height:msg.height,
                x:2,
                y:y*10+2,
                owner:msg.sender,
            }
            send({type:OPEN_WINDOW.RESPONSE_NAME, target:msg.sender, window:win_id})
        }
        log("got message",msg)
    })

    function send(msg) {
        //log('sending',msg)
        socket.send(JSON.stringify(msg))
    }
    const can = $("#canvas")
    on(can,'mousedown',(e)=>{
        let pt = mouseevent_to_pixels(e)
        let win = find_window(pt)
        if(win) {
            send({type:MOUSE.DOWN.NAME, x:pt.x-win.x, y:pt.y-win.y, target:win.owner})
        }
    })
    on(can,'mouseup',e => {
        let pt = mouseevent_to_pixels(e)
        let win = find_window(pt)
        if(win) {
            send({type:MOUSE.UP.NAME, x:pt.x-win.x, y:pt.y-win.y, target:win.owner})
        }
    })

    setInterval(()=>send_heartbeat(socket),1000)
})