import {default as WebSocket} from "ws"
import * as PI from "pureimage"
import fs from "fs"
import {Window} from "./toolkit/guitoolkit.js"
import {WINDOWS} from "idealos_schemas/js/windows.js"
import {GRAPHICS} from 'idealos_schemas/js/graphics.js'

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
            this.send({
                type:"APP_OPEN",
                app_type:"CLIENT",
                app:this.appid
            })
            let req_win = WINDOWS.MAKE_WindowOpen({
                x:50,
                y:50,
                width:this.width,
                height:this.height,
                sender:appid,
                app:appid,
                window_type:window_type
            })
            req_win.app = appid
            this.ws.send(JSON.stringify(req_win))
        })
        this.ws.on("message",(data)=>{
            let msg = JSON.parse(data)
            // console.log("incoming message",msg);
            if(msg.type === WINDOWS.TYPE_WindowOpenResponse) {
                this.win_id = msg.window
                this.fireLater('start',{})
                return
            }
            this.fireLater(msg.type,msg)
        })


        process.on('SIGTERM', () => this.a_shutdown())
        this.theme = null
        this.win = new Window(this,width,height)
    }
    async a_shutdown() {
        this.log("shuting down the app")
            this.send(WINDOWS.MAKE_window_close_response({
                target:this.appid,
                window:this.win_id,
            }))
        setTimeout(()=>{
            this.ws.close()
            process.exit(0)
        },500)
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
