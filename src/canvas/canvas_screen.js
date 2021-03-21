/*

wait for page to load
open connection to server
show status of connection on screen
process drawing events by drawing
process input events by sending to server
 */

const $ = (sel) => document.querySelector(sel)
const on = (elm, type, cb) => elm.addEventListener(type,cb)


$("#status").innerText = "disconnected"

function log(...args) { console.log(...args) }

on(window,'load',() =>{
    log("the page is loaded")
    let socket = new WebSocket("ws://localhost:8081")
    on(socket,'open',()=>{
        log("connected to the server")
        $("#status").innerText = "connected"
        socket.send(JSON.stringify({type:"START",kind:'SCREEN'}))
    })
    on(socket,'error',(e)=> log("error",e))

    on(socket,'message',(e)=>{
        let msg = JSON.parse(e.data)
        log("got message",msg)
        if(msg.type === 'DRAW_PIXEL') {
            let c = $('#canvas').getContext('2d')
            let scale = 20
            c.fillStyle = msg.color
            c.fillRect(msg.x*scale,msg.y*scale,1*scale*0.9,1*scale*0.9)
        }
    })

    const can = $("#canvas")
    on(can,'mousedown',(e)=>{
        log("mouse down at",e)
        socket.send(JSON.stringify({type:'MOUSE_DOWN',x:e.clientX,y:e.clientY}))
    })
    on(can,'mouseup',e => {
        log("mouse up at",e)
        socket.send(JSON.stringify({type:'MOUSE_UP',x:e.clientX,y:e.clientY}))
    })
})