import WS from "ws"
import {WindowTracker} from './windows.js'
import {AppTracker} from './apps.js'
import {ConnectionManager} from "./connections.js"
import {EventRouter} from "./router.js"

import {sleep} from '../common.js'
import {GENERAL} from "idealos_schemas/js/general.js"
import Ajv from 'ajv'
import fs from 'fs'
import path from 'path'
import {LiveDB} from './db.js'
import {DOCS} from "../../resources/database/example_docs.js"
import {AudioService} from './audio.js'

export const hostname = '127.0.0.1'
export const websocket_port = 8081

export class CentralServer {
    constructor(opts) {
        this.log('starting with opts', opts)
        if (!opts.websocket_port) throw new Error("no webssocket port set!")
        this.websocket_port = opts.websocket_port
        this.hostname = opts.hostname

        if (!opts.apps) throw new Error("no applist provided")

        this.themes = null
        if(opts.themes) {
            this.themes = opts.themes
            this.uitheme = this.themes['light']
        }

        this.screens = [
            {
                width:250,
                height:250,
            }
        ]
        if(opts.screens) this.screens = opts.screens
        this.translations = []
        if(opts.translations) this.translations = opts.translations
        this.active_translation = this.translations[0]

        this.fonts = {}
        if(opts.fonts) this.fonts = opts.fonts

        this.cons = new ConnectionManager()

        let sender = (msg) => {
            // console.log("RELAUYING BACK",msg.type)
            this.cons.forward_to_screen(msg)
        }
        let log = (...args) => this.log(...args)
        this.wids = new WindowTracker(sender, this.cons,this)
        this.at = new AppTracker(this.hostname, this.websocket_port,
            log, this.wids, sender, this.cons)
        this.router = new EventRouter(this.cons, this.wids, this.at, this)
        this.apps = opts.apps
        this.db = new LiveDB()
        this.db.importDocs(DOCS)
        this.audio = new AudioService()
    }

    async start() {
        this.keybindings = await load_keybindings("resources/keybindings.json")

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
                this.cons.remove_connection(ws)
            })
            ws.send(JSON.stringify(GENERAL.MAKE_Connected({})))
        })
        this._wsserver.on("close", (m) => {
            this.log('server closed', m)
        })
        this._wsserver.on('error', (e) => {
            this.log("server error", e)
        })

        for (let app of this.apps.system) {
            if(app.disabled !== true) await this.start_app(app)
        }
        for (let app of this.apps.user) {
            if (app.autostart === true) {
                await this.start_app(app)
            } else {
                await this.at.create_app(app)
            }
        }

    }

    log(...args) {
        console.log('CENTRAL',...args)
    }

    async start_app(opts) {
        let app = this.at.create_app(opts)
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
            this.log("stopped")
        })
    }

    async get_app_list() {
        return this.at.list_apps()
    }

    async stop_app(id) {
        return this.at.stop(id)
    }

    start_app_by_id(id) {
        return this.at.start(id)
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
export async function load_translation(json_path) {
    return JSON.parse((await fs.promises.readFile(json_path)).toString())
}

export async function load_keybindings(json_path) {
    return JSON.parse((await fs.promises.readFile(json_path)).toString())
}
