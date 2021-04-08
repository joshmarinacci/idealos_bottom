import {spawn} from 'child_process'

export class AppTracker {
    constructor(hostname,websocket_port) {
        this.hostname = hostname
        this.websocket_port = websocket_port
        this.apps = []
    }
    log(...args) {
        console.log(...args)
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
        app.subprocess = spawn('node', [
            app.path,
            `ws://${this.hostname}:${this.websocket_port}`,app.id
        ].concat(app.args))
        app.subprocess.stdout.on('data',(data)=>this.log(`STDOUT ${app.name} ${data}`))
        app.subprocess.stderr.on('data',(data)=>this.log(`STDERR ${app.name} ${data}`))
        app.subprocess.on('exit',(code)=> this.log(`${app.name} ended with code = ${code}`))
    }

    get_app_by_id(id) {
        return this.apps.find(ap => ap.id === id)
    }

    has_app(id) {
        return this.apps.some(ap => ap.id === id)
    }

    stop(id) {
        let app = this.get_app_by_id(id)
        app.subprocess.kill('SIGTERM')
        app.subprocess = undefined
    }

    list_apps() {
        return this.apps.slice().map(app => ({
            id:app.id,name:app.name,path:app.path,args:app.args,
        }))
    }
}