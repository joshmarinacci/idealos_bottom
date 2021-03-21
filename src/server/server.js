/*

setup webserver for canvas client
setup websockets server for message passing
wait for canvas client to connect with websockets
launch app 1
launch app 2
wait for apps to connect
route input events from canvas to apps
route drawing events from apps to canvas
 */


import WS from "ws"
import fs from "fs"
import http from "http"
import path from "path"
import {spawn} from "child_process"
const hostname = '127.0.0.1'
const webserver_port = 3000
const websocket_port = 8081

function log(...args) { console.log(...args) }
const sleep = (dur) => new Promise((res,rej) => setTimeout(res,dur))

const connections = {}

function start_message_server() {
    const server = new WS.Server({
        port: websocket_port,
    })
    log(`started websocket server on ws://${hostname}:${websocket_port}`)

    server.on("connection", (ws) => {
        ws.on("message", (m) => {
            let msg = JSON.parse(m)
            // log("incoming message", msg)
            if(msg.type === 'START') {
                if(msg.kind === 'SCREEN') {
                    connections['SCREEN'] = ws
                }
            }
            if(msg.type === 'OPEN_WINDOW') {
                log("app is opening a window",msg)
                if(!connections['SCREEN']) {
                    log("can't open a window because there is no screen")
                }
            }
            if(msg.type === 'DRAW_PIXEL') {
                //send to the screen
                if(connections['SCREEN']) {
                    // log("sending to screen")
                    connections['SCREEN'].send(JSON.stringify(msg))
                } else {
                    // log("no screen connected!")
                }
            }
        })
        ws.send(JSON.stringify({message: 'CONNECTED'}))
    })
}
function start_web_server() {
    return new Promise((res,rej)=>{
        const webserver = http.createServer((req, res) => {
            log(`requested ${req.url}`)
            let file = path.resolve(path.join('src/canvas/', req.url))
            log(`sending: ${file}`)
            fs.readFile(file, (err, data) => {
                if (err) {
                    log("error", err)
                    res.statusCode = 404
                    res.send()
                    return
                }
                res.statusCode = 200
                if (file.endsWith('.js')) res.setHeader('Content-Type', 'application/javascript')
                if (file.endsWith('.html')) res.setHeader('Content-Type', 'text/html')
                res.write(data)
                res.end()
            })
        })
        webserver.listen(webserver_port, hostname, () => {
            log(`started webserver at http://${hostname}:${webserver_port}/`)
            res()
        })
    })
}

function start_app(app) {
    log('starting app',app)
    const child = spawn('node', [app.path].concat(app.args))
    child.stdout.on('data',(data)=>log(`STDOUT ${app.name} ${data}`))
    child.stderr.on('data',(data)=>log(`STDERR ${app.name} ${data}`))
    child.on('exit',(code)=> log(`${app.name} ended with code = ${code}`))
}
async function start_app1() {
    let app = {
        name:'app1',
        path: 'src/clients/app1.js',
        args: [`ws://${hostname}:${websocket_port}`],
    }
    await sleep(250)
    start_app(app)
}
async function start_app2() {
    let app = {
        name:'app2',
        path: 'src/clients/app2.js',
        args: [`ws://${hostname}:${websocket_port}`],
    }
    await sleep(250)
    start_app(app)
}

await start_message_server()
await start_web_server()

function screen_connected() {
    log("waiting for the screen to connect. please refresh the page")
    return new Promise((res,rej)=>{
        let id = setInterval(()=>{
            if(connections['SCREEN']) {
                log("screen attached")
                clearInterval(id)
                res()
            }
        },500)
    })
}

await screen_connected()
await start_app1()
await start_app2()
log('started everything')