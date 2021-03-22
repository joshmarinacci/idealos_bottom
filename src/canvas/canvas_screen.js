/*

wait for page to load
open connection to server
show status of connection on screen
process drawing events by drawing
process input events by sending to server
 */
import {DRAW_PIXEL, HEARTBEAT, MOUSE, OPEN_WINDOW} from "./messages.js"

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
        if(msg.type === DRAW_PIXEL.NAME) {
            if(!windows[msg.window]) {
                log("no such window",msg.window)
                return
            }
            let win = windows[msg.window]
            // log("drawing pixel to window",win)
            let c = $('#canvas').getContext('2d')
            c.fillStyle = msg.color
            c.fillRect(win.x*scale+msg.x*scale,win.y*scale+msg.y*scale,1*scale*0.9,1*scale*0.9)
            return
        }
        if(msg.type === OPEN_WINDOW.NAME) {
            let win_id = "id_"+Math.floor(Math.random()*10000)
            let y = Object.keys(windows).length
            windows[win_id] = {
                id:win_id,
                width:msg.width,
                height:msg.height,
                x:0,
                y:y*10,
                owner:msg.sender,
            }
            send({type:OPEN_WINDOW.RESPONSE_NAME, target:msg.sender, window:win_id})
        }
        log("got message",msg)
    })

    function send(msg) {
        console.log('sending',msg)
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