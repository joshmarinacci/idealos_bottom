import fs, {FSWatcher} from "fs";

export async function read_json(path) {
    let raw = await fs.promises.readFile(path)
    // console.log("raw is",raw.toString())
    return JSON.parse(raw.toString())
}

export class JFont {
    public info: any;
    constructor(data: any) {
        this.info = data
    }
}

class FontWatcher {
    private virtual: JFont;
    private singles: JFont[];
    private paths: string[];
    private watchers: FSWatcher[];
    private name: string;
    private manager: FontManager;
    constructor(manager:FontManager, name: string, paths: string[]) {
        this.manager = manager
        this.name = name
        this.virtual = null
        this.singles = []
        this.paths = paths
    }

    async init() {
        this.singles = await Promise.all(this.paths.map(file => this.refresh_file(file)))
        console.log("loaded font watcher for",this.name, this.paths)
        this.watchers = this.paths.map(file => {
            return fs.watch(file,()=>this.refresh_file(file))
        })
    }

    private async refresh_file(file: string):Promise<JFont> {
        console.log("refreshing the file", file)
        try {
            let data = await read_json(file)
            console.log("sauccess loading",data,typeof data)
            if(typeof data !== 'object') throw new Error(`error parsing file ${file}`)
            let font = new JFont(data)
            this.virtual = font
            console.log('set virtual to ',this.virtual)
            this.manager.fire_event({
                type: "font-update",
                success: true,
                fontname: this.name
            })
            return font
        } catch (e) {
            this.log("error loading font",e)
            this.log("virtual is still",this.virtual)
            this.manager.fire_event({
                type: "font-update",
                success: false,
                fontname: this.name
            })
        }
    }

    async get_virtual_font():Promise<JFont> {
        if(!this.virtual) await this.init()
        return this.virtual
    }

    shutdown() {
        this.watchers.forEach(fsw => fsw.close())
    }

    private log(...args) {
        this.manager.log(...args)
    }
}

export class FontManager {
    private server: any;
    private fonts: Map<string, FontWatcher>;
    private listeners: Map<string, any[]>
    constructor(server: any) {
        this.server = server
        this.listeners = new Map()
        this.fonts = new Map()
    }

    log(...args) {
        console.log("FONT_MANAGER:",...args)
    }

    // async load() {
    //     if(!this.fonts) {
    //         this.fonts = {
    //             base: JSON.parse((await fs.promises.readFile("resources/fonts/font.json")).toString())
    //         }
    //     }
    // }

    // request_font(msg: any) {
    //     let resp = null
    //     if(!this.fonts[msg.name]) {
    //         resp = make_response(msg, {
    //             type: 'request-font-response',
    //             name:msg.name,
    //             succeeded: false,
    //         })
    //     } else {
    //         resp = make_response(msg,{
    //             type: 'request-font-response',
    //             succeeded: true,
    //             name:msg.name,
    //             font:this.fonts[msg.name]
    //         })
    //     }
    //     // @ts-ignore
    //     resp.app = msg.app
    //     // console.log("sending font to app",resp.app,resp)
    //     // @ts-ignore
    //     if(resp.app) {
    //         // @ts-ignore
    //         this.server.app_manager.send_to_app(resp.app,resp)
    //     } else {
    //         this.server.app_manager.send_to_type("SCREEN", resp)
    //     }
    //
    // }

    watch_font_from_paths(name: string, paths: string[]) {
        this.fonts.set(name, new FontWatcher(this,name,paths))
    }

    async get_font(base: string) : Promise<JFont> {
        return this.fonts.get(base).get_virtual_font()
    }

    shutdown() {
        for (let fw of this.fonts.values()) fw.shutdown()
    }


    wait_for_event(fontUpdate: string) {
        return new Promise((res,rej)=>{
            this.on(fontUpdate, (e) => {
                console.log("event happend")
                res(e)
            })
        })

    }

    fire_event(event: any) {
        this.get_listeners(event.type).forEach(cb => cb(event))
    }

    private get_listeners(type) {
        if(!this.listeners.has(type))this.listeners.set(type,[])
        return this.listeners.get(type)
    }

    private on(type: string, cb: (e) => void) {
        this.get_listeners(type).push(cb)
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
