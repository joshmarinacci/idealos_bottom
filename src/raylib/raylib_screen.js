import {default as R} from 'raylib'
import {default as WebSocket} from "ws"
import {DRAW_PIXEL, FILL_RECT, HEARTBEAT, OPEN_WINDOW} from '../canvas/messages.js'


function log(...args) { console.log(...args) }
const on = (elm, type, cb) => elm.addEventListener(type,cb)

const windows = {}

function open_screen() {


    const screenWidth = 640
    const screenHeight = 480
    R.InitWindow(screenWidth, screenHeight, "raylib [core] example - basic window")
    R.SetTargetFPS(60)

    function do_loop() {
        if(R.WindowShouldClose()) {
            R.CloseWindow()        // Close window and OpenGL context
            return
        } else {
            R.BeginDrawing();
            R.ClearBackground(R.RAYWHITE)
            // R.DrawText("Congrats! You created your first window!", 190, 200, 20, R.LIGHTGRAY)
            // const position = {
            //     x: 100,
            //     y: 100
            // }
            // const size = {
            //     x: 200,
            //     y: 150
            // }
            // R.DrawRectangleV(position, size, R.DARKBLUE)

            // R.DrawRectangleRec({
            //     x: 50,
            //     y: 50,
            //     width: 50,
            //     height: 50
            // }, R.PINK)

            let scale = 10
            Object.values(windows).forEach(win => {
                win.rects.forEach(r => {
                    // log('drawing',r)
                    R.DrawRectangleRec({
                        x: (win.x+r.x) * scale,
                        y: (win.y+r.y) * scale,
                        width: r.width * scale,
                        height: r.height * scale,
                    }, R.PINK)
                })
            })

            R.EndDrawing()
        }
        setTimeout(do_loop,0)
    }
    do_loop()
}

function send_heartbeat(ws) {
    ws.send(JSON.stringify({type:HEARTBEAT.NAME}))
}


function handle_drawing(msg, windows) {
    if(!windows[msg.window]) {
        log("no such window",msg.window)
        return
    }
    let win = windows[msg.window]
    if(msg.type === DRAW_PIXEL.NAME) {
        log("drawing pixel",msg)
        win.rects.push({x:msg.x,y:msg.y,width:1,height:1,color:msg.color})
    }
    if(msg.type === FILL_RECT.NAME) {
        log("adding a rect to the scene",msg)
        win.rects.push(msg)
    }
}

function connect_server() {

    let socket = new WebSocket("ws://localhost:8081")
    on(socket,'open',()=>{
        log("connected to the server")
        socket.send(JSON.stringify({type:"START",kind:'SCREEN'}))
        open_screen()
    })
    on(socket,'error',(e)=> log("error",e))
    on(socket, 'close',(e)=>{
        log("closed",e)
    })

    function send(msg) {
        log('sending',msg)
        socket.send(JSON.stringify(msg))
    }

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
                rects:[]
            }
            send({type:OPEN_WINDOW.RESPONSE_NAME, target:msg.sender, window:win_id})
        }
        log("got message",msg)
    })
    setInterval(()=>send_heartbeat(socket),1000)
}

connect_server()
