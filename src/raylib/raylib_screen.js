import {default as R} from 'raylib'
import {default as WebSocket} from "ws"
import {
    DRAW_PIXEL,
    DRAWING,
    FILL_RECT,
    HEARTBEAT,
    MOUSE,
    OPEN_WINDOW,
    SCREEN
} from '../canvas/messages.js'
import {WindowTracker} from '../server/windows.js'

function log(...args) { console.log(...args) }
const on = (elm, type, cb) => elm.addEventListener(type,cb)

const COLORS = {
    'black':R.BLACK,
    'green':R.GREEN,
    'red':R.RED,
    'aqua':R.AQUA,
}
const screenWidth = 640
const screenHeight = 480
const window_title = "Raylib test"
let scale = 10
let socket = null
let wids = new WindowTracker()
function send(msg) {
    // log('sending',msg)
    socket.send(JSON.stringify(msg))
}

function shutdown() {
    R.CloseWindow()        // Close window and OpenGL context
    return
}
function draw_windows() {
    Object.values(wids.windows).forEach(win => {
        //draw the window border
        R.DrawRectangleRec({
            x: (win.x - 1) * scale,
            y: (win.y - 1) * scale,
            width: (win.width+2) * scale,
            height: (win.height+2) * scale,
        }, COLORS['black'])
        //draw the window contents
        win.rects.forEach(r => {
            let color = COLORS[r.color]
            if(color) {
                R.DrawRectangleRec({
                    x: (win.x + r.x) * scale,
                    y: (win.y + r.y) * scale,
                    width: r.width * scale,
                    height: r.height * scale,
                }, color)
            } else {
                log("missing color",r.color)
            }
        })
    })
}

function raylibevent_to_pixels(e) {
    return {
        x:Math.floor(e.x/scale),
        y:Math.floor(e.y/scale)
    }
}

function check_input() {
    if(R.IsMouseButtonPressed(R.MOUSE_LEFT_BUTTON)) {
        let e = R.GetMousePosition()
        let pt = raylibevent_to_pixels(e)
        let win = wids.find(pt)
        if(win) {
            send({type:MOUSE.DOWN.NAME, x:pt.x-win.x, y:pt.y-win.y, target:win.owner})
        }
    }
    if(R.IsMouseButtonReleased(R.MOUSE_LEFT_BUTTON)) {
        let e = R.GetMousePosition()
        let pt = raylibevent_to_pixels(e)
        let win = wids.find(pt)
        if(win) {
            send({type:MOUSE.UP.NAME,   x:pt.x-win.x, y:pt.y-win.y, target:win.owner})
        }
    }
}

function open_screen() {
    R.InitWindow(screenWidth, screenHeight, window_title)
    R.SetTargetFPS(60)

    function render_loop() {
        //check end
        if(R.WindowShouldClose()) return shutdown()
        R.BeginDrawing();
        R.ClearBackground(R.RAYWHITE)
        check_input()
        //draw all windows
        draw_windows()

        R.EndDrawing()
        setTimeout(render_loop,0)
    }
    render_loop()
}

function send_heartbeat(ws) {
    ws.send(JSON.stringify({type:HEARTBEAT.NAME}))
}

function handle_drawing(msg) {
    if(!wids.has_window_id(msg.window)) return log("no such window",msg.window)
    let win = wids.window_for_id(msg.window)
    if(msg.type === DRAW_PIXEL.NAME) {
        win.rects.push({x:msg.x,y:msg.y,width:1,height:1,color:msg.color})
    }
    if(msg.type === FILL_RECT.NAME) {
        win.rects.push(msg)
    }
}

function refresh_windows() {
    Object.values(wids.windows).forEach(win => {
        send({type:DRAWING.REFRESH_WINDOW, target:win.owner, window:win.id})
    })
}

function connect_server() {
    socket = new WebSocket("ws://localhost:8081")
    on(socket,'open',()=>{
        log("connected to the server")
        socket.send(JSON.stringify({type:SCREEN.START}))
        open_screen()
    })
    on(socket,'error',(e)=> log("error connecting",e.reason))
    on(socket, 'close',(e)=>{
        log("closed",e.reason)
    })
    on(socket,'message',(e)=>{
        let msg = JSON.parse(e.data)
        if(msg.type === DRAW_PIXEL.NAME) return handle_drawing(msg);
        if(msg.type === FILL_RECT.NAME) return handle_drawing(msg);
        if(msg.type === OPEN_WINDOW.SCREEN_NAME) return wids.add_window(msg.window.id,msg.window)
        if(msg.type === SCREEN.WINDOW_LIST) {
            wids.sync_windows(msg.windows)
            refresh_windows()
            return
        }
        log("got message",msg)
    })
    setInterval(()=>send_heartbeat(socket),1000)
}

connect_server()
