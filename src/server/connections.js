import {WINDOWS} from 'idealos_schemas/js/windows.js'

export const CLIENT_TYPES = {
    SCREEN:'SCREEN',
    DEBUG:'DEBUG',
    TEST:'TEST',
    MENUBAR:'MENUBAR',
    DOCK:'DOCK',
    APP:'APP',
    SIDEBAR:'SIDEBAR',
}


export class ConnectionManager {
    constructor() {
        this.by_type = {}
        Object.keys(CLIENT_TYPES).forEach(typ => this.by_type[typ]=[])
    }

    handle_start_message(ws,msg,wids) {
        this.log("assigned to screen",CLIENT_TYPES.SCREEN)
        this.by_type[CLIENT_TYPES.SCREEN].push(ws)
        this.forward_to_screen(WINDOWS.MAKE_window_list({windows:wids.windows}))
    }
    forward_to_screen(msg) {
        this.by_type[CLIENT_TYPES.SCREEN].forEach(cl => {
            cl.send(JSON.stringify(msg))
        })
    }


    forward_to_debug(msg) {
        this.by_type[CLIENT_TYPES.DEBUG].forEach(cl => {
            cl.send(JSON.stringify(msg))
        })
    }
    forward_to_menubar(msg) {
        this.by_type[CLIENT_TYPES.MENUBAR].forEach(cl => {
            cl.send(JSON.stringify(msg))
        })
    }

    log(...args) {
        console.log(...args)
    }


    add_connection(type, sender, ws) {
        this.log(`adding connection for type ${type} and sender ${sender}`)
        this.by_type[type].push(ws)
        this.add_app_connection(sender,ws)
    }

    add_app_connection(id,ws) {
        this.by_type[CLIENT_TYPES.APP].push({
            id:id,
            ws:ws,
        })
    }

    forward_to_app(id, msg) {
        let app = this.by_type[CLIENT_TYPES.APP].find(app => app.id === id)
        if(!app) throw new Error(`no such app for id ${id}`)
        app.ws.send(JSON.stringify(msg))
    }
    forward_to_all_apps(msg) {
        this.by_type[CLIENT_TYPES.APP].forEach(app => {
            app.ws.send(JSON.stringify(msg))
        })
    }

    remove_connection(ws) {
        console.log("connections removing for ",ws.target)
    }

    count() {
        return -1
    }

    forward_to_target(msg) {
        return this.forward_to_app(msg.target,msg)
    }
}
