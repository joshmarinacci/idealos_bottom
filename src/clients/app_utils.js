import {default as WebSocket} from "ws"
import {DRAW_PIXEL, OPEN_WINDOW} from '../canvas/messages.js'
import fs from "fs"

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
            this.log("sending message to app itself",msg)
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

class PixelFontImpl {
    constructor(img, metrics) {
        this.bitmap = img
        this.metrics = metrics
    }

    draw_text(app, x, y, text, color) {
        app.log('drawing text ',text,'at',x,y)
        app.send({type:DRAW_PIXEL.NAME, x:x, y:y, color:color})

    }
}

export const PixelFont = {
    load: async function (image_source,metrics_source) {
        console.log("loading font",image_source,metrics_source)
        let img_buffer = await fs.promises.readFile(image_source)
        let metrics_buffer = await fs.promises.readFile(metrics_source)
        let metrics = JSON.parse(metrics_buffer.toString())
        return new PixelFontImpl(null,metrics)
    }
}