import {Server} from "ws";
import fs from "fs";

export class FontManager {
    private fonts: any;
    private server: any;
    constructor(server: any) {
        this.server = server
    }


    async load() {
        if(!this.fonts) {
            this.fonts = {
                base: JSON.parse((await fs.promises.readFile("resources/fonts/font.json")).toString())
            }
        }
    }

    request_font(msg: any) {
        let resp = null
        if(!this.fonts[msg.name]) {
            resp = make_response(msg, {
                type: 'request-font-response',
                name:msg.name,
                succeeded: false,
            })
        } else {
            resp = make_response(msg,{
                type: 'request-font-response',
                succeeded: true,
                name:msg.name,
                font:this.fonts[msg.name]
            })
        }
        // @ts-ignore
        resp.app = msg.app
        // console.log("sending font to app",resp.app,resp)
        // @ts-ignore
        if(resp.app) {
            // @ts-ignore
            this.server.app_manager.send_to_app(resp.app,resp)
        } else {
            this.server.app_manager.send_to_type("DISPLAY",resp)
        }

    }
}

function make_response(orig:any, settings:any) {
    let msg = {
        id: "msg_" + Math.floor((Math.random() * 10000)),
        response_to: orig.id
    }
    Object.entries(settings).forEach(([key, value]) => {
        // @ts-ignore
        msg[key] = value
    })
    return msg
}
