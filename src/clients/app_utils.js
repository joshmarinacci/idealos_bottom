import {default as WebSocket} from "ws"
import * as PI from "pureimage"
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


        process.on('SIGTERM', () => {
            console.log(`Received SIGTERM in app ${appid} `);
            this.ws.close()
            process.exit(0)
        });

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
        this.info = metrics
    }

    draw_text(app, x, y, text, color) {
        app.log('drawing text ',text,'at',x,y)
        // app.log("image is",this.bitmap)
        // app.log("metrics is",this.info.metrics)
        let dx = x
        let dy = y
        text.split("\n").forEach(line => {
            // app.log("line",line)
            app.log("dy",dy)
            for(let n=0; n<line.length; n++) {
                let ch = line.charCodeAt(n)
                let met = this.info.metrics[ch]
                // app.log("drawing char",ch,met)
                if(met && met.w > 0) {
                    for(let i=0; i<met.w; i++) {
                        for(let j=0; j<met.h; j++) {
                            let color = this.bitmap.getPixelRGBA(i+met.x,j+met.y)
                            if(color > 0) {
                                app.send({type:DRAW_PIXEL.NAME, x:dx+i, y:dy+j-met.h - 3, color:'black'})
                            }
                        }
                    }
                    dx += met.w
                    dx += 1
                }
            }
            dy += 10
        })
    }
}

export const PixelFont = {
    load: async function (image_source,metrics_source) {
        console.log("loading font",image_source,metrics_source)
        let img = await PI.decodePNGFromStream(fs.createReadStream(image_source))
        let metrics_buffer = await fs.promises.readFile(metrics_source)
        let metrics = JSON.parse(metrics_buffer.toString())
        return new PixelFontImpl(img,metrics)
    }
}