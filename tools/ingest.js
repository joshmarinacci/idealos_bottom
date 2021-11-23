//ingest file --server url
import {promises as fs} from "fs"
import path from 'path'
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

class U {
    constructor() {
        this.depth = 0
    }
    p(...args) {
        console.log(this.tab(),...args)
    }

    tab() {
        let str = ""
        for(let i=0; i<this.depth; i++) {
            str += " "
        }
        return str
    }

    indent() {
        this.depth++
    }

    outdent() {
        this.depth--
    }
}
const u = new U()
async function import_dir(conn, name) {
    if(path.basename(name).startsWith('.')) return
    let stat = await fs.stat(name)
    if(stat.isDirectory()) {
        for(let file of await fs.readdir(name)) {
            let pth = path.join(name, file)
            u.indent()
            await import_dir(conn,pth)
            u.outdent()
        }
    }
    if(stat.isFile()) {
        u.p("  importing",name)
        let resp = await conn.send_and_wait_for_response({
            type:'ingest-file',
            file:name,
        })
        log("response is",resp)
    }
}

async function run(dir) {
    if(!dir) throw new Error("missing import directory")
    //open web socket connection
    let conn = new Conn("127.0.0.1",8081)
    await conn.connect()
    log('connected')
    await import_dir(conn,dir)
    await conn.disconnect()
    log("disconnected")
}

run(process.argv[2]).then(o => log(o)).catch(e => log(e))
