/*

wait for page to load
open connection to server
show status of connection on screen
process drawing events by drawing
process input events by sending to server
 */

const $ = (sel) => document.querySelector(sel)
const on = (elm, type, cb) => elm.addEventListener(type,cb)

const scale = 20


$("#status").innerText = "disconnected"

function log(...args) { console.log(...args) }

function mouseevent_to_pixels(e) {
    let rect = e.target.getBoundingClientRect()
    return {x:Math.floor((e.clientX-rect.x)/scale),y:Math.floor((e.clientY-rect.y)/scale)}
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

    on(socket,'message',(e)=>{
        let msg = JSON.parse(e.data)
        log("got message",msg)
        if(msg.type === 'DRAW_PIXEL') {
            let c = $('#canvas').getContext('2d')
            c.fillStyle = msg.color
            c.fillRect(msg.x*scale,msg.y*scale,1*scale*0.9,1*scale*0.9)
        }
    })

    function send(msg) {
        socket.send(JSON.stringify(msg))
    }
    const can = $("#canvas")
    on(can,'mousedown',(e)=>{
        let pt = mouseevent_to_pixels(e)
        send({type:'MOUSE_DOWN',x:pt.x,y:pt.y})
    })
    on(can,'mouseup',e => {
        let pt = mouseevent_to_pixels(e)
        send({type:'MOUSE_UP',x:pt.x,y:pt.y})
    })
})