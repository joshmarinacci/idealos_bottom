import {default as WebSocket} from "ws"
import {OPEN_WINDOW} from '../canvas/messages.js'

export class CommonApp {
    constructor(argv,width,height) {
        // this.log("starting",argv)
        let addr = argv[2]
        let appid = argv[3]
        this.width = width
        this.height = height
        // this.log("app",appid,"starting")
        // this.log("connecting to",addr)
        this.listeners = {}
        this.ws = new WebSocket(addr);
        this.ws.on('open',()=>{
            // this.log("got the connection")
            this.ws.send(JSON.stringify({type:OPEN_WINDOW.NAME,width:this.width, height:this.height,sender:appid}))
        })
        this.ws.on("message",(data)=>{
            let msg = JSON.parse(data)
            if(msg.type === OPEN_WINDOW.RESPONSE_NAME) {
                // this.log("our window id is",msg.window)
                this.win_id = msg.window
                this.fireLater('start',{})
                return
            }
            // this.log("sending message to app",msg)
            this.fireLater(msg.type,msg)
        })
    }
    on(type,cb) {
        if(!this.listeners[type]) this.listeners[type] = []
        this.listeners[type].push(cb)
    }
    log(...args) { console.log(...args) }

    fireLater(type, payload) {
        setTimeout(()=>{
            let evt = {
                type:type,
                payload:payload
            }
            if(this.listeners[type])  this.listeners[type].forEach(cb => {
                cb(evt)
            })
        },1)
    }

    send(msg) {
        msg.window = this.win_id
        this.ws.send(JSON.stringify(msg))
    }
}