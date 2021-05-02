import {spawn} from 'child_process'

export class AppTracker {
    constructor(hostname,websocket_port, log_delegate, wids) {
        this.hostname = hostname
        this.websocket_port = websocket_port
        this.apps = []
        this.log_delegate = log_delegate
        this.wids = wids
    }
    log(...args) {
        if(this.log_delegate) this.log_delegate(...args)
    }

    create_app(opts) {
        let app = {
            name:opts.name,
            path:opts.path,
            args:opts.args,
            id: "app_"+(Math.floor(Math.random()*100000))
        }
        this.apps.push(app)
        return app
    }


    start(id) {
        let app = this.get_app_by_id(id)
        if(!app) return console.error(`no such app ${id}`)
        if(app.subprocess) {
            return console.error(`app is already running, it seems ${id}`)
        }
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
    }

    list_apps() {
        return this.apps.slice().map(app => ({
            id:app.id,name:app.name,path:app.path,args:app.args,
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
}