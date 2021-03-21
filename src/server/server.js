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

const hostname = '127.0.0.1'
const webserver_port = 3000
const websocket_port = 8081

function log(...args) { console.log(...args) }
const sleep = (dur) => new Promise((res,rej) => setTimeout(res,dur))


function start_message_server() {
    const server = new WS.Server({
        port: websocket_port,
    })
    log(`started websocket server on ws://${hostname}:${websocket_port}`)

    server.on("connection", (ws) => {
        ws.on("message", (m) => {
            let msg = JSON.parse(m)
            log("incoming message", msg)
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
async function start_app1() {
    let app = {
        path: 'src/clients/app1.js',
        args: [`ws://${hostname}:${websocket_port}`],
    }
    await sleep(1000)
    log('starting app',app)
}

await start_message_server()
await start_web_server()
await start_app1()
log('started everything')