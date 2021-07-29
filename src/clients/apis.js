import {DEBUG} from 'idealos_schemas/js/debug.js'
import {WINDOWS} from 'idealos_schemas/js/windows.js'

export const SYSTEM = {
    async start_app_by_name(conn,name) {
        return conn.send(DEBUG.MAKE_StartAppByName({ name:name }))
    },
    async start_sub_app(conn, entrypoint) {
        return conn.send_and_wait_for_response({
            type:"START_SUB_APP",
            entrypoint:entrypoint
        }).then(r=>r.appid)
    },
    async request_font(conn, name) {
        return conn.send_and_wait_for_response({
            type: "request-font",
            name: name,
        }).then(r => {
            if (r.succeeded) return r.font
            throw new Error("request font failed")
        })
    },
    async open_window(app, sender, x, y, width, height, window_type) {
        return app.send_and_wait_for_response(WINDOWS.MAKE_WindowOpen({
            x, y, width, height, window_type, sender }))
    }
}

export const AUDIO = {
    //returns audio resource
    async load(conn,resource) {
        return conn.send_and_wait_for_response({
            type: "AUDIO",
            command: "load", resource: resource
        }).then(msg => {
            return msg.resource
        })
    },
    //plays the resource
    async play(conn,resource){
        return conn.send({
            type:"AUDIO",
            command:"play",
            resource:resource
        })
    },
    //pauses the resource
    async pause(conn,resource){
        return conn.send({
            type:"AUDIO",
            command:"pause",
            resource:resource
        })
    },
}
