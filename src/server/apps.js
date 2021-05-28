import {spawn} from 'child_process'
import {DEBUG} from 'idealos_schemas/js/debug.js'

export class AppTracker {
    constructor(hostname,websocket_port, log_delegate, wids, sender) {
        this.hostname = hostname
        this.websocket_port = websocket_port
        this.apps = []
        this.log_delegate = log_delegate
        this.wids = wids
        this.send = sender
    }
    log(...args) {
        if(this.log_delegate) this.log_delegate(...args)
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
        this.send(DEBUG.MAKE_AppStarted({target:app.id}))
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
        app.subprocess.on('exit',(code)=> {
            this.log(`${app.name} ended with code = ${code}`)
            app.subprocess = undefined
        })

        this.send(DEBUG.MAKE_AppStarted({target:id}))
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
        let app = this.get_app_by_id(id)
        if(!app) return console.error(`no such app ${id}`)
        if(app.subprocess) {
            app.subprocess.kill('SIGTERM')
            app.subprocess = undefined
        } else {
            console.log("Looks like it was already killed")
        }
        this.wids.remove_windows_for_appid(id)
        this.send(DEBUG.MAKE_AppStopped({target:id}))
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

    start_sub_app(msg,cons) {
        // console.log('starting a sub app',msg)
        let app = this.create_app({
            name:"widgetname",
            entrypoint:msg.entrypoint,
            args:[],
        })
        app.type = "sub"
        app.owner = msg.app
        // console.log("app is",app)
        this.start(app.id)
        cons.forward_to_app(msg.app,{
            type:"START_SUB_APP_RESPONSE",
            target:msg.app,
            appid:app.id,
        })
    }
}
