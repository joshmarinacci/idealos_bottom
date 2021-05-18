import WS from "ws"
import {WindowTracker} from './windows.js'
import {AppTracker} from './apps.js'
import {ResourceManager} from './resources.js'
import {CLIENT_TYPES, ConnectionManager} from "./connections.js"
import {EventRouter} from "./router.js"

import {sleep} from '../common.js'
import {RESOURCES} from "idealos_schemas/js/resources.js"
import {INPUT} from "idealos_schemas/js/input.js"
import {DEBUG} from "idealos_schemas/js/debug.js"
import {GENERAL} from "idealos_schemas/js/general.js"
import {MENUS} from 'idealos_schemas/js/menus.js'
import Ajv from 'ajv'
import fs from 'fs'
import path from 'path'


export const hostname = '127.0.0.1'
export const webserver_port = 3000
export const websocket_port = 8081


const cons = new ConnectionManager()
const wids = new WindowTracker(send_delegate,cons)
const at = new AppTracker(hostname,websocket_port,log,wids,send_delegate,cons)
const router = new EventRouter(cons,wids)


function log(...args) {
    console.log(...args)
    cons.forward_to_debug(GENERAL.MAKE_Log({data:args}))
}
function send_delegate(msg) {
    cons.forward_to_screen(msg)
}


let resources = new ResourceManager(log, respond)


function forward_to_debug(msg) {
    cons.forward_to_debug(msg)
}

function forward_to_target(msg) {
    if(!msg.target) return log("NO TARGET!",msg)
    cons.forward_to_app(msg.target,msg)
}
function forward_to_app(msg) {
    if(!msg.app) return log("NO TARGET!",msg)
    cons.forward_to_app(msg.app,msg)
}

function start_test(ws,msg) {
    log("attaching unit test runner")
    cons.add_connection(CLIENT_TYPES.TEST,msg.sender,msg)
}
// function list_apps(ws,msg) {
//     log("listing apps for debug message",msg)
//     cons.add_connection(CLIENT_TYPES.DEBUG, ws.sender,msg)
//     let response = DEBUG.MAKE_ListAppsResponse({
//         connection_count:Object.keys(cons.count()).length,
//         apps:at.list_apps(),
//     })
//     // if(connections[CLIENT_TYPES.DEBUG]) return connections[CLIENT_TYPES.DEBUG].send(JSON.stringify(response))
// }

function respond(msg,resp) {
    resp.target = msg.sender
    cons.forward_to_app(msg.sender,msg)
}

function forward_to_focused(msg) {
    let win = wids.get_active_window()
    if(win && win.owner) return cons.forward_to_app(win.owner,msg)
}


function dispatch(msg,ws) {
    try {
        console.log("server displatching",msg)
        cons.forward_to_debug(msg)
        router.route(ws,msg)
        if(msg.type === GENERAL.TYPE_ScreenStart) return cons.handle_start_message(ws,msg,wids)


        if(msg.type === MENUS.TYPE_SetMenubar) return cons.forward_to_menubar(msg)

        // if(msg.type === DEBUG.TYPE_ListAppsRequest) return list_apps(ws,msg)
        if(msg.type === DEBUG.TYPE_RestartApp) return at.restart(msg.target)
        if(msg.type === DEBUG.TYPE_StopApp) return at.stop(msg.target)
        if(msg.type === DEBUG.TYPE_StartApp) return at.start(msg.target)
        if(msg.type === DEBUG.TYPE_StartAppByName) return at.start_app_by_name(msg.name)

        // if(msg.type === DEBUG.TYPE_TestStart) return start_test(ws,msg)

        if(msg.type === RESOURCES.TYPE_ResourceGet) return resources.get_resource(msg)
        if(msg.type === INPUT.TYPE_Action) return forward_to_focused(msg)
        // if (msg.type === RESOURCES.TYPE_ResourceSet) return resources.set_resource(msg)
        // if (message_match(SCHEMAS.RESOURCE.SET, msg)) return resources.set_resource(msg)
        // if(message_match('CREATE_MENU_TREE',msg)) return forward_to_menubar(msg)

        log("SERVER: unknown incoming message", msg)
    } catch (e) {
        log("ERROR",e)
    }

}
export class CentralServer {
    constructor(opts) {
        this.log('starting with opts', opts)
        if (!opts.websocket_port) throw new Error("no webssocket port set!")
        this.websocket_port = opts.websocket_port
        this.hostname = opts.hostname

        if (!opts.apps) throw new Error("no applist provided")

        if(opts.uitheme) this.uitheme = opts.uitheme

        this.cons = new ConnectionManager()

        let sender = (msg) => {
            // console.log("RELAUYING BACK",msg.type)
            this.cons.forward_to_screen(msg)
        }
        let log = (...args) => this.log(...args)
        this.wids = new WindowTracker(sender, this.cons)
        this.at = new AppTracker(this.hostname, this.websocket_port,
            log, this.wids, sender, this.cons)
        this.router = new EventRouter(this.cons, this.wids)
        this.apps = opts.apps
    }

    async start() {
        this._wsserver = new WS.Server({
            port: this.websocket_port
        })
        this.log(`started websocket port on ws://${hostname}:${websocket_port}`)
        this._wsserver.on('connection', (ws) => {
            ws.on("message", (m) => {
                let msg = JSON.parse(m)
                this.dispatch(msg, ws)
            })
            ws.on('close', (code) => {
                cons.remove_connection(ws)
            })
            ws.send(JSON.stringify(GENERAL.MAKE_Connected({})))
        })
        this._wsserver.on("close", (m) => {
            log('server closed', m)
        })
        this._wsserver.on('error', (e) => {
            log("server error", e)
        })

        for (let app of this.apps.system) {
            if(app.disabled !== true) await this.start_app(app)
        }
        for (let app of this.apps.user) {
            if (app.autostart === true) await this.start_app(app)
        }

    }

    log(...args) {
        console.log('CENTRAL',...args)
    }

    async start_app(opts) {
        let app = this.at.create_app(opts)
        await sleep(250)
        this.at.start(app.id)
    }

    async start_app_cb(opts) {
        let app = this.at.create_app(opts)
        return {
            app: app,
            info: this.at.start_cb(app.id)
        }
    }


    dispatch(msg, ws) {
        try {
            // this.log("SERVER dispatching", msg)
            // this.cons.forward_to_debug(msg)
            this.router.route(ws, msg)
        } catch (e) {
            this.log(e)
        }
    }

    async send(msg) {
        this.dispatch(msg)
    }

    shutdown() {
        return new Promise((res,rej)=>{
            this._wsserver.close(()=>{
                console.log('close is done')
                res()
            })
            log("stopped")
        })
    }

    async get_app_list() {
        return this.at.list_apps()
    }
}

async function load_checker(dir, schema_names) {
    const ajv = new Ajv()
    let ms = await fs.promises.readFile("node_modules/ajv/lib/refs/json-schema-draft-06.json")
    ajv.addMetaSchema(JSON.parse(ms.toString()))
    let _schemas = {}
    for (let name of schema_names) {
        // console.log(`loading ${name} from ${dir}`)
        let json = JSON.parse((await fs.promises.readFile(path.join(dir, name))).toString())
        ajv.addSchema(json)
        _schemas[name] = json
        // console.log("loading",name)
    }
    return {
        validate: function (json_data, schema_name) {
            if (!_schemas[schema_name]) throw new Error(`no such schema ${schema_name}`)
            let sch = _schemas[schema_name]
            console.log(typeof sch, typeof json_data, schema_name)
            // console.log("compling",sch)
            let validate_apps_schema = ajv.compile(sch)
            let valid = validate_apps_schema(json_data)
            if (!valid) console.warn("two errors", validate_apps_schema.errors)
            return validate_apps_schema
        }
    }
}

export async function load_applist(json_path) {
    let checker = await load_checker("resources/schemas", ["app.schema.json", "applist.schema.json"])
    let data = JSON.parse((await fs.promises.readFile(json_path)).toString())
    let result = checker.validate(data, "applist.schema.json")
    if (result === false) throw new Error(`error loading ${json_path} ${checker.errors}`)
    return data
}
export async function load_uitheme(json_path) {
    // let checker = await load_checker("resources/schemas", ["uitheme.schema.json"])
    let data = JSON.parse((await fs.promises.readFile(json_path)).toString())
    // let result = checker.validate(data, "uitheme.schema.json")
    // if (result === false) throw new Error(`error loading ${json_path} ${checker.errors}`)
    return data
}
