//ingest file --server url

import {default as WebSocket} from 'ws'

const log = (...args) => console.log("script",...args)

class Conn {
    constructor(hostname, port) {
        this.hostname = hostname
        this.port = port
        this.pending = new Map()
    }
    async send_and_wait_for_response(msg) {
        msg.id = "ingest_"+Math.floor(Math.random()*10000000)
        return new Promise((res, rej) => {
            this.pending.set(msg.id,m2=> res(m2))
            this.ws.send(JSON.stringify(msg),e=>e?rej(e):"")
        })
    }

    connect() {
        return new Promise((res,rej)=>{
            this.ws = new WebSocket(`ws://${this.hostname}:${this.port}`)
            this.ws.on('message', (txt) => {
                // log("got a message")
                this._received(JSON.parse(txt))
            })
            this.ws.on("open", () => {
                log("opened")
                res()
            })
        })
    }

    disconnect() {
        return new Promise((res,rej)=>{
            this.ws.on('close',()=>{
                res()
            })
            this.ws.close()
        })
    }

    _received(msg) {
        if(this.pending.has(msg.response_to)) {
            this.pending.get(msg.response_to)(msg)
            this.pending.delete(msg.response_to)
        } else {
            log("got a response to a mesage we don't recognize",msg)
        }
    }
}

async function run() {
    let file = "resources/hilton.mp3"
    //open web socket connection
    let conn = new Conn("127.0.0.1",8081)
    await conn.connect()

    log('connected')

    let resp = await conn.send_and_wait_for_response({
        type:'ingest-file',
        file:file,
    })
    log("response is",resp)

    {
        let resp2 = await conn.send_and_wait_for_response({
            type:'get-document-info',
            docid:resp.docid
        })
        log("response to get info is",resp2)
    }

    await conn.disconnect()
    log("disconnected")

}

run().then(o => log(o)).catch(e => log(e))
