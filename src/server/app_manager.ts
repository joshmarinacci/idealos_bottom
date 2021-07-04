import {spawn, ChildProcessWithoutNullStreams} from "child_process";
import WebSocket from "ws";
// @ts-ignore
import {WINDOWS} from "idealos_schemas/js/windows.js"
// @ts-ignore
import {DEBUG} from "idealos_schemas/js/debug.js";
// @ts-ignore
import {GENERAL} from "idealos_schemas/js/general.js";


type AppType = "SCREEN" | "DEBUG" | "TEST" | "MENUBAR" | "DOCK" | "APP" | "SIDEBAR" | "CHILD" | "SUB"
type WindowType = "MENUBAR" | "DOCK" | "SIDEBAR" | "DEBUG" | "CHILD" | "PLAIN"

type NO_OWNER = "NO_OWNER"

interface Window {
    type:WindowType,
    id:string,
    x:number,
    y:number,
    width:number,
    height:number,
    app_owner:string,
    parent:string|NO_OWNER,
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
    private active_window: Window | undefined;
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
            type:opts.type || "APP",
            args:opts.args || [],
            owner:"NO_OWNER"
        }
        this.apps.push(app)
        return app
    }

    app_connected(msg: any, ws: WebSocket) {
        this.log("app connected",msg)
        let app = this.get_app_by_id(msg.app)
        if(app === undefined) {
            return console.error(`app missing ${msg.app}`)
        } else {
            // @ts-ignore
            app.connection = ws
            console.log("attached app")
            this.send_to_app(app.id, GENERAL.MAKE_Connected({app:app.id}))
        }
    }
    screen_connected(msg:any, ws:WebSocket) {
        this.log("screen connected",msg)
        let app = this.create_app({})
        app.type = "SCREEN"
        app.connection = ws
        let win_list = this.get_window_list()
        let win_map:any = {}
        win_list.forEach(win => win_map[win.id] = {
            id:win.id,
            owner:win.app_owner,
            x:win.x,
            y:win.y,
            width:win.width,
            height:win.height,
            parent:win.parent,
            window_type:win.type,
        })
        this.send_to_app(app.id, {
            type:GENERAL.TYPE_Connected,
            app:app.id
        })
        let resp = WINDOWS.MAKE_window_list({windows:win_map})
        // console.log("response is",resp)
        this.send_to_app(app.id,resp)
    }

    is_sub_app(id:string) {
        let app = this.get_app_by_id(id)
        if(app !== undefined && app.type ==="SUB") return true
        return false
    }

    open_window(msg: any) {
        if(this.is_sub_app(msg.app)) {
            let resp = WINDOWS.MAKE_WindowOpenResponse({target:msg.sender, window:"som_win_id"+Math.random()})
            this.send_to_app(msg.sender,resp)
            let app = this.get_app_by_id(msg.app)
            if(app !== undefined) {
                let parent = this.get_app_by_id(app.owner)
                if (parent !== undefined) {
                    this.send_to_app(parent.id, msg)
                    this.send_to_app(parent.id, {
                        type: "SUB_APP_WINDOW_OPEN",
                        app: msg.app,
                        window: resp.window
                    })
                }
            }
            return
        }

        let app = this.get_app_by_id(msg.app)
        if(app === undefined ) return console.error("app is undefined")
        let win:Window = {
            x:msg.x,
            y: msg.y,
            width:msg.width,
            height:msg.height,
            app_owner:app.id,
            type: "PLAIN",
            parent:"NO_OWNER",
            id:"win_"+Math.floor(Math.random()*10000)
        }
        if(msg.window_type === 'menubar') {
            win.type = "MENUBAR"
            win.x = 0
            win.y = 0
        }
        if(msg.window_type === 'dock') {
            win.type = "DOCK"
            win.x = 0
            win.y = 20
        }
        if(msg.window_type === 'sidebar') {
            win.type = "SIDEBAR"
            win.x = 256-win.width
            win.y = 20
        }


        app?.windows.push(win)
        let msg2 = WINDOWS.MAKE_WindowOpenDisplay({
            target:msg.sender,
            window:{
                id:win.id,
                x:win.x,
                y:win.y,
                width:win.width,
                height:win.height,
                owner:win.app_owner,
                window_type:win.type,
            }
        })
        this.send_to_type("SCREEN",msg2)
        //send response back to client
        this.send_to_app(msg.sender,WINDOWS.MAKE_WindowOpenResponse({
            target:msg.sender,
            window:win.id,
        }))
    }


    close_window(msg: any) {
        // console.log("really closing window",msg)
        let app = this.get_app_by_id(msg.target)
        if(app !== undefined) {
            // console.log("app windows are",app.id, app.windows)
            let win = app.windows.find(win => win.id === msg.window)
            // console.log("found a window to close",win)
            app.windows = app.windows.filter(win => win.id !== msg.window)
            this.send_to_type("SCREEN", msg)
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

    start_app_by_name(msg: any) {
        let app = this.apps.find(app => app.name === msg.name)
        if(app !== undefined)  this.start_app_by_id(app.id)
    }
    start_sub_app(msg: any) {
        let app = this.create_app({
            name:"widgetname",
            entrypoint:msg.entrypoint,
            args:[],
        })
        app.type = "SUB"
        app.owner = msg.app
        this.start_app_by_id(app.id)
        this.send_to_app(msg.app,{
            type:"START_SUB_APP_RESPONSE",
            id: "msg_"+Math.floor((Math.random()*10000)),
            response_to:msg.id,
            target:msg.app,
            appid:app.id,
        })
    }

    stop_app(msg: any) {
        return new Promise<void>((res,rej)=>{
            let app = this.get_app_by_id(msg.target)
            if(app === undefined) return console.error(`no such app ${msg.target}`)
            try {
                if(app.connection !== undefined) {
                    app.connection.on("close", () => {
                        res()
                    })
                }
                if (app.subprocess) {
                    app.subprocess.kill('SIGTERM')
                    app.subprocess = undefined
                } else {
                    console.log("Looks like it was already killed")
                }
            } catch (e) {
                console.log("error",e)
                res()
            }
        })
    }



    get_app_by_id(id: String):App | undefined {
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
    handle_list_all_apps(msg:any) {
        this.send_to_app(msg.app,DEBUG.MAKE_ListAppsResponse({
            connection_count:this.apps.length,
            apps:this.list_apps(),
        }))
    }
    handle_list_all_apps2(msg: any) {
        this.send_to_app(msg.app, {
            type: "LIST_ALL_APPS_RESPONSE",
            target: msg.sender,
            apps: this.server.apps
        })
    }

    get_parent_of_sub_app(id: String) {
        let app = this.get_app_by_id(id)
        if(!app) throw new Error("app not found")
        return this.get_app_by_id(app.owner)
    }

    send_to_type(app_type: AppType, msg: any) {
        // this.log("send_to_type",app_type,msg.type)
        let apps = this.apps.filter(a => a.type === app_type)
        apps.forEach((app: App) => {
            app.connection?.send(JSON.stringify(msg))
        })
    }
    send_to_app(appid:string, msg:any) {
        // this.log("send_to_app",appid,msg.type)
        let app = this.get_app_by_id(appid)
        app?.connection?.send(JSON.stringify(msg))
    }
    send_to_target(msg: any) {
        this.send_to_app(msg.target,msg)
    }

    private get_window_list():Window[] {
        let wins: Window[] = []
        this.apps.forEach(app => {
            app.windows.forEach(win => {
                wins.push(win)
            })
        })
        return wins
    }

    set_focused_window(msg: any) {
        let win = this.window_for_id(msg.window)
        if(!win) return this.log(`no such window ${msg.window}`)
        if(!win.app_owner) return this.log(`window has no owner ${win.app_owner}`)
        //send focus lost to old window
        let old_win = this.get_active_window()
        if(old_win !== undefined) {
            this.send_to_app(old_win.app_owner,{
                type:"WINDOW_FOCUS_LOST",
                app:old_win.app_owner,
                window:old_win.id
            })
        }
        this.set_active_window(win)
        this.send_to_app(win.app_owner,msg)
    }

    set_active_window(win: Window) {
        this.active_window = win
    }

    private get_active_window():Window|undefined {
        return this.active_window
    }

    private window_for_id(id:string) {
        return this.get_window_list().find(win => win.id === id)
    }

    set_window_position(msg: any) {
        let win = this.window_for_id(msg.window)
        if(!win) return this.log(`no such window ${msg.window}`)
        if(!win.app_owner) return this.log(`window has no owner ${win.app_owner}`)
        win.x = msg.x
        win.y = msg.y
        this.send_to_app(win.app_owner,msg)
    }

    set_window_size(msg: any) {
        // this.log("set window size",msg)
        let win = this.window_for_id(msg.window)
        if(!win) return this.log(`no such window ${msg.window}`)
        if(!win.app_owner) return this.log(`window has no owner ${win.app_owner}`)
        win.width = msg.width
        win.height = msg.height
        this.send_to_app(win.app_owner,msg)
    }

    handle_websocket_closed(ws: WebSocket) {
        console.log("websocket is closed now")
        let app = this.apps.find(app => app.connection === ws)
        console.log("app count",this.apps.length)
        if(app !== undefined) {
            // @ts-ignore
            // this.apps = this.apps.filter(a => a.id !==app.id)
        }
        console.log("app count",this.apps.length)
    }

    force_stop_all_apps() {
        this.apps.forEach(app => {
            if (app.subprocess) {
                console.log("killing app dead")
                app.subprocess.kill('SIGTERM')
                app.subprocess = undefined
            }
        })
    }

    dump() {
        console.log("app manager stage")
        this.apps.forEach(app => {
            console.log("app",app.id, app.type, app.name, "running:",app.subprocess!==undefined)
        })
    }
}
