import {default as WebSocket} from "ws"
import * as PI from "pureimage"
import {make_message, message_match, SCHEMAS} from '../canvas/messages.js'
import fs from "fs"
import {Window} from "./guitoolkit.js"

export class CommonApp {
    constructor(argv,width,height, window_type="plain") {
        let addr = argv[2]
        let appid = argv[3]
        this.appid = appid
        this.width = width
        this.height = height
        this.listeners = {}
        this.ws = new WebSocket(addr);
        this.ws.on('open',()=>{
            this.ws.send(JSON.stringify(make_message(SCHEMAS.WINDOW.OPEN,{width:this.width,height:this.height,sender:appid, window_type:window_type})))
        })
        this.ws.on("message",(data)=>{
            let msg = JSON.parse(data)
            // console.log("incoming message",msg);
            if(message_match(SCHEMAS.WINDOW.OPEN_RESPONSE,msg)) {
                this.win_id = msg.window
                this.fireLater('start',{})
                return
            }
            this.fireLater(msg.type,msg)
        })


        process.on('SIGTERM', () => {
            console.log(`Received SIGTERM in app ${appid} `);
            this.ws.close()
            process.exit(0)
        });
        this.theme = null
        this.win = new Window(this,width,height)
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
        msg.app = this.appid
        this.ws.send(JSON.stringify(msg))
    }
}

class BufferImage {
    constructor(width, height) {
        this.width = width;
        this.height = height;
        this.pixels = new Array(width*height*4)
        this.pixels.fill(0)
    }
    to_array() {
        return this.pixels
    }

    set(x, y, r,g,b,a) {
        if(x<0) return;
        if(y<0) return;
        let n = (y*this.width+x)*4;
        if(n>=this.width*this.height*4) return;
        this.pixels[n+0] = r
        this.pixels[n+1] = g
        this.pixels[n+2] = b
        this.pixels[n+3] = a
    }
}

const color_map = {
    'black':  [0,   0,   0,255],
    'red':    [255, 0,   0,255],
    'green':  [0, 255,   0,255],
    'blue':   [0,    0,255,255],
    'white':  [255,255,255,255],
    'magenta':[255,0,  255,255],
}

function color_to_rgba(color) {
    if(color_map[color]) return color_map[color]
    return [255,255,0,255]
}

const KEY_CODES = {
    SPACE:32,
}
const space_width = 3;
const line_height = 10;

class PixelFontImpl {
    constructor(img, metrics) {
        this.bitmap = img
        this.info = metrics
    }

    measure_text(app,text) {
        let dx = 0
        let dy = 0

        text.split("\n").forEach(line => {
            for(let n=0; n<line.length; n++) {
                let ch = line.charCodeAt(n)
                let met = this.info.metrics[ch]
                if(ch === KEY_CODES.SPACE) {
                    dx += space_width
                }
                if(met && met.w > 0) {
                    dx += met.w;
                    dx += 1;
                }
            }
            dy += line_height
        })
        return {
            width:dx,
            height:dy,
        }
    }
    draw_text(app, x, y, text, color) {
        let rgba = color_to_rgba(color)
        let full_metrics = this.measure_text(app,text);
        let dx = 0
        let dy = 0
        let w = full_metrics.width;
        let h = full_metrics.height;
        let img = new BufferImage(w,h)
        text.split("\n").forEach(line => {

            for(let n=0; n<line.length; n++) {
                let ch = line.charCodeAt(n)
                let met = this.info.metrics[ch]
                if(ch === KEY_CODES.SPACE) {
                    dx += space_width
                }
                if(met && met.w > 0) {
                    for(let i=0; i<met.w; i++) {
                        for(let j=0; j<met.h; j++) {
                            let color = this.bitmap.getPixelRGBA(i+met.x,j+met.y)
                            if(color > 0) {
                                img.set(dx+i, dy+j+line_height-met.h, ...rgba)
                            }
                        }
                    }
                    dx += met.w
                    dx += 1
                }
            }
            dy += line_height
        })
        app.send(make_message(SCHEMAS.DRAW.IMAGE,{x:x,y:y,width:w,height:h,pixels:img.to_array()}))
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