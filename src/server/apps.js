import {spawn} from 'child_process'
import {DEBUG} from 'idealos_schemas/js/debug.js'

export class AppTracker {
    constructor(server,hostname,websocket_port) {
        this.hostname = hostname
        this.websocket_port = websocket_port
        this.apps = []
        this.server = server
    }
    log(...args) {
        this.server.log(...args)
    }

    create_app(opts) {
        let app = {
            type:'plain',
            name:opts.name,
            path:opts.entrypoint,
            args:opts.args,
            id: "app_"+(Math.floor(Math.random()*100000))
        }
        this.apps.push(app)
        return app
    }
    start_cb(id) {
        let app = this.get_app_by_id(id)
        if(!app) return console.error(`no such app ${id}`)
        this.server.cons.forward_to_screen(DEBUG.MAKE_AppStarted({target:app.id}))
        return {
            hostname:this.hostname,
            websocket_port:this.websocket_port,
            id:app.id,
        }
    }
    start(id) {
        let app = this.get_app_by_id(id)
        if(!app) return console.error(`no such app ${id}`)
        if(app.subprocess) {
            return console.error(`app is already running, it seems ${id}`)
        }
        console.log("spawning",app.path)
        app.subprocess = spawn('node', [
            app.path,
            `ws://${this.hostname}:${this.websocket_port}`,app.id
        ].concat(app.args))
        app.subprocess.stdout.on('data',(data)=>this.log(`STDOUT ${app.name} ${data}`))
        app.subprocess.stderr.on('data',(data)=>this.log(`STDERR ${app.name} ${data}`))
        this.server.cons.forward_to_screen(DEBUG.MAKE_AppStarted({target:id}))
    }

    get_app_by_id(id) {
        return this.apps.find(ap => ap.id === id)
    }
    get_app_by_name(name) {
        return this.apps.find(ap => ap.name === name)
    }

    has_app(id) {
        return this.apps.some(ap => ap.id === id)
    }

    stop(id) {
        return new Promise((res,rej)=>{
            let app = this.get_app_by_id(id)
            if(!app) return console.error(`no such app ${id}`)
            try {
                let ws = this.server.cons.find_connection_for_appid(app.id)
                ws.on("close", () => {
                    res()
                })
                if (app.subprocess) {
                    app.subprocess.kill('SIGTERM')
                    app.subprocess = undefined
                } else {
                    console.log("Looks like it was already killed")
                }
                this.server.wids.remove_windows_for_appid(id)
                this.server.cons.remove_connection_for_appid(id)
                this.server.cons.forward_to_screen(DEBUG.MAKE_AppStopped({target: id}))
            } catch (e) {
                res()
            }
        })
    }

    list_apps() {
        return this.apps.slice().map(app => ({
            id:app.id,
            name:app.name,
            path:app.path,
            args:app.args,
            running:(app.subprocess?true:false)
        }))
    }

    start_app_by_name(name) {
        let app = this.get_app_by_name(name)
        return this.start(app.id)
    }

    restart(target) {
        this.log("restarting not supported yet")
    }

    is_sub_app(id) {
        let app = this.get_app_by_id(id)
        if(app && app.type === 'sub') return true
        return false
    }

    get_parent_of_sub_app(id) {
        let app = this.get_app_by_id(id)
        let owner = this.get_app_by_id(app.owner)
        return owner
    }
    start_sub_app(msg) {
        let app = this.create_app({
            name:"widgetname",
            entrypoint:msg.entrypoint,
            args:[],
        })
        app.type = "sub"
        app.owner = msg.app
        this.start(app.id)
        this.server.cons.forward_to_app(msg.app,{
            type:"START_SUB_APP_RESPONSE",
            id: "msg_"+Math.floor((Math.random()*10000)),
            response_to:msg.id,
            target:msg.app,
            appid:app.id,
        })
    }
    handle_list_all_apps(msg) {
        this.server.cons.forward_to_app(msg.app, {
            type: "LIST_ALL_APPS_RESPONSE",
            target: msg.sender,
            apps: this.server.apps
        })
    }

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
}

export function is_apps(msg) {
    if(msg.type === APPS_GROUP.LIST_ALL_APPS) return true
    if(msg.type === APPS_GROUP.START_SUB_APP) return true
    if(msg.type === DEBUG.TYPE_StartAppByName) return true
    if(msg.type === DEBUG.TYPE_StopApp)  return true
    if(msg.type === DEBUG.TYPE_StartApp) return true
    if(msg.type === DEBUG.TYPE_ListAppsRequest) return true
    return false
}

export const APPS_GROUP = {
    LIST_ALL_APPS: "LIST_ALL_APPS",
    "START_SUB_APP":"START_SUB_APP"
}

