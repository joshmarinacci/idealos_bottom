import {ServiceDef, ServicesManager} from '../src/server/services.js'
import {Message, MessageBroker} from "../src/server/messages.js"
import WebSocket from "ws";

// let PATH = "resources/hilton.mp3"
let PATH= "examples_music.mp3"

interface AudioMessage extends Message {
    command:string,
    resource:string
}

type CB = (obj:any) => void
class EventHandler {
    private listeners: Map<String, CB[]>;
    constructor() {
        this.listeners = new Map<String,CB[]>();
    }
    on(type:string, cb:CB) {
        if(!this.listeners.has(type)) this.listeners.set(type,[])
        this.listeners.get(type).push(cb)
    }
    off(type:string, cb:CB) {
        if(!this.listeners.has(type)) this.listeners.set(type,[])
        this.listeners.set(type,this.listeners.get(type).filter(c => c !== cb ))
    }
    protected fire(type: string, msg: any) {
        if(!this.listeners.has(type)) this.listeners.set(type,[])
        this.listeners.get(type).forEach(cb => cb(msg))
    }
}

class TestingServer extends EventHandler implements MessageBroker {
    private services: ServicesManager;
    private _server: WebSocket.Server;
    private websocket_port: number;
    private hostname: string;
    private connection?: WebSocket;

    constructor(param: {
        hostname: string;
        websocket_port: number;
        services: ServiceDef[],
    }) {
        super();
        this.hostname = param.hostname
        this.websocket_port = param.websocket_port
        this.services = new ServicesManager(this,param.services)
    }

    async start() {
        this.services.start()
        this._server = new WebSocket.Server({
            port: this.websocket_port
        })
        this._server.on('connection', (ws) => {
            this.log("connection opened")
            this.connection = ws
            ws.on("message", (m) => {
                this.log('incoming message',m)
                let parts = m.toString().split(":")
                let msg:AudioMessage = {
                    type:"AUDIO",
                    command:parts[0],
                    resource:parts[1]
                }
                this.fire(msg.type,msg)
                // @ts-ignore
                // let msg = JSON.parse(m)
                // this.log("got message complete for",msg.type)
            })
            ws.on('close', (code) => {
                this.log("connection closed")
                // this.app_manager.handle_websocket_closed(ws)
            })
        })
        this._server.on("close", (m: any) => {
            this.log('server closed', m)
        })
        this._server.on('error', (e) => {
            this.log("server error", e)
        })

        this.log(`started websocket port on ws://${this.hostname}:${this.websocket_port}`)
    }

    send(msg: Message) {
        if(msg.type === 'AUDIO') {
            let msg2 = msg as AudioMessage
            this.connection.send(msg2.command+":"+msg2.resource)
            return
        }
        this.connection.send(JSON.stringify(msg))
    }

    wait_for_message(_type: string) {
        return new Promise((res,rej)=>{
            let han = (o:any) => {
                this.off(_type,han)
                res(o)
            }
            this.on(_type,han)
        })
    }

   shutdown() {
        return new Promise<void>((res, rej) => {
            this._server.close(() => {
                this.log("stopped messages")
                res()
            })
        })
    }

    private log(...args) {
        console.log("TEST_SERVER",...args);
    }

    sleep(number: number) {
        return new Promise((res,rej)=>{
            setTimeout(()=>{
                res("yo")
            },number)
        })

    }

}

describe("tests the audio service", function() {
    this.timeout(10000)
    it("starts the audio service", async function () {
        let audio_def:ServiceDef = {
            name:'audio',
            root:'../idealos_audioservice',
            command:'cargo run'
        }
        const server = new TestingServer({
            hostname:'127.0.0.1',
            websocket_port:8081,
            services: [audio_def]
        })

        await server.start()

        //send in a fake audio message to load sound
        await server.sleep(4000)
        server.send({type:"AUDIO", command:"load", resource:PATH} as AudioMessage)
        //wait for return
        let resp1:AudioMessage = await server.wait_for_message("AUDIO") as AudioMessage
        console.log("got back response",resp1)
        //send play sound
        server.send({type:"AUDIO", command:"play", resource:resp1.resource} as AudioMessage)
        //wait for return
        let resp2 = await server.wait_for_message("AUDIO")
        console.log("got back response",resp2)
        //wait for status message at the one second mark
        // let resp3 = await server.wait_for_message("AUDIO")
        // console.log("got back response",resp3)

        await server.sleep(4000)
        //send pause sound
        server.send({type:"AUDIO", command:"pause", resource:resp1.resource} as AudioMessage)
        //wait for return
        let resp4 = await server.wait_for_message("AUDIO")
        console.log("got back response",resp4)

        //shut it down
        await server.shutdown()
    })
})
