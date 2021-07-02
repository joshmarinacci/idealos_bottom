import {spawn, ChildProcessWithoutNullStreams} from "child_process";
import WebSocket from "ws";
// @ts-ignore
import {WINDOWS} from "idealos_schemas/js/windows.js"
// import {DEBUG} from 'idealos_schemas/js/debug.js'

type AppType = "SCREEN" | "DEBUG" | "TEST" | "MENUBAR" | "DOCK" | "APP" | "SIDEBAR" | "CHILD"
type WindowType = "MENUBAR" | "DOCK" | "SIDEBAR" | "DEBUG" | "CHILD" | "PLAIN"

type NO_OWNER = "NO_OWNER"

interface Window {
    type:WindowType,
    id:string,
    x:number,
    y:number,
    width:number,
    height:number,
    owner:string|NO_OWNER,
}

interface App {
    owner: string|NO_OWNER;
    type:AppType,
    id:string,
    name:string,
    entrypoint:string,
    args:string[],
    windows:Window[],
    subprocess:ChildProcessWithoutNullStreams|undefined,
    connection:WebSocket|undefined
}

export const APPS_GROUP = {
    LIST_ALL_APPS: "LIST_ALL_APPS",
    "START_SUB_APP":"START_SUB_APP"
}

export class AppManager {
    private apps: App[];
    private readonly hostname: String;
    private readonly websocket_port: Number;
    private readonly server: any;
    constructor(server:any,hostname:String,websocket_port:Number) {
        this.hostname = hostname
        this.websocket_port = websocket_port
        this.apps = []
        this.server = server
    }
    create_app(opts:any):App {
        console.log("creating app with opts",opts)
        let app:App = {
            subprocess: undefined,
            connection:undefined,
            windows: [],
            id: "app_"+(Math.floor(Math.random()*100000)),
            name: opts.name || "unnamed",
            entrypoint: opts.entrypoint,
            type:"APP",
            args:opts.args || [],
            owner:"NO_OWNER"
        }
        this.apps.push(app)
        return app
    }

    app_connected(msg: any, ws: WebSocket) {
        this.log("app connected",msg)
        let app = this.get_app_by_id(msg.app)
        if(typeof app === undefined) {
            return console.error(`app missing ${msg.app}`)
        } else {
            // @ts-ignore
            app.connection = ws
            console.log("attached app")
        }
    }

    open_window(msg: any) {
        this.log("opening a window",msg)
        if(msg.window_type === 'plain') {
            let app = this.get_app_by_id(msg.app)
            let win:Window = {
                x:msg.x,
                y: msg.y,
                width:msg.width,
                height:msg.height,
                owner: "NO_OWNER",
                type: "PLAIN",
                id:"win_"+Math.floor(Math.random()*10000)
            }
            app?.windows.push(win)
            this.send_to_type("SCREEN", WINDOWS.MAKE_WindowOpenDisplay({
                target:msg.sender,
                window:{
                    id:win.id,
                    x:win.x,
                    y:win.y,
                    width:win.width,
                    height:win.height,
                    owner:win.owner,
                    window_type:win.type,
                }
            }))
            //send response back to client
            this.send_to_app(msg.sender,WINDOWS.MAKE_WindowOpenResponse({
                target:msg.sender,
                window:win.id,
            }))
        }
    }

    start_app_by_id(id:String) {
        let app = this.get_app_by_id(id)
        if(typeof app === 'undefined') return console.error(`no such app ${id}`)
        if(app.subprocess) {
            return console.error(`app is already running, it seems ${id}`)
        }
        let args:string[] = [app.entrypoint,
            `ws://${this.hostname}:${this.websocket_port}`,
            app.id,
            ...app.args
        ]
        app.subprocess = spawn('node', args)
        // @ts-ignore
        app.subprocess.stdout.on('data',(data:any)=>this.log(`STDOUT ${app.name} ${data}`))
        // @ts-ignore
        app.subprocess.stderr.on('data',(data:any)=>this.log(`STDERR ${app.name} ${data}`))
        // this.server.cons.forward_to_screen(DEBUG.MAKE_AppStarted({target:id}))
        console.log("app started")
    }

    private get_app_by_id(id: String):App | undefined {
        return this.apps.find(ap => ap.id === id)
    }
    private log(...args: any[]) {
        this.server.log(...args)
    }
    list_apps() {
        return this.apps.slice().map(app => ({
            id:app.id,
            name:app.name,
            path:app.entrypoint,
            args:app.args,
            running:(!!app.subprocess)
        }))
    }
    handle_list_all_apps(msg: { app: any; sender: any; }) {
        this.server.cons.forward_to_app(msg.app, {
            type: "LIST_ALL_APPS_RESPONSE",
            target: msg.sender,
            apps: this.server.apps
        })
    }
    /*
    handle(msg) {
        if(msg.type === APPS_GROUP.LIST_ALL_APPS) return this.handle_list_all_apps(msg)
        if(msg.type === APPS_GROUP.START_SUB_APP) return this.start_sub_app(msg)
        if(msg.type === DEBUG.TYPE_StartAppByName) return this.start_app_by_name(msg.name);
        if(msg.type === DEBUG.TYPE_StopApp)  return this.stop(msg.target)
        if(msg.type === DEBUG.TYPE_StartApp) return this.start(msg.target)
        if(msg.type === DEBUG.TYPE_ListAppsRequest) {
            return this.server.cons.forward_to_debug(DEBUG.MAKE_ListAppsResponse({
                connection_count:this.server.cons.count(),
                apps:this.server.at.list_apps(),
            }))
        }
    }


    is_sub_app(id) {
        let app = this.get_app_by_id(id)
        return app && app.type === 'sub';
    }
*/
    get_parent_of_sub_app(id: String) {
        let app = this.get_app_by_id(id)
        if(!app) throw new Error("app not found")
        return this.get_app_by_id(app.owner)
    }

    private send_to_type(display: AppType, msg: any) {
        console.log('sending to type', display,msg)
        let apps = this.apps.filter(a => a.type === display)
        apps.forEach((app: App) => {
            app.connection?.send(JSON.stringify(msg))
        })
    }
    private send_to_app(appid:string, msg:any) {
        console.log("sending to app",msg)
        let app = this.get_app_by_id(appid)
        app?.connection?.send(JSON.stringify(msg))
    }

}
