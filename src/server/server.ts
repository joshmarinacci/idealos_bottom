// @ts-ignore
import Ajv from 'ajv'
import fs from 'fs'
import path from 'path'
// import {AudioService} from './audio.js'
// import {DataBase} from './db/db.js'
import {KeybindingsManager} from './keybindings.js'
import {is_theme, ThemeManager} from './themes.js'
import {AppManager} from './app_manager.js'
import WebSocket from "ws";
import {FontManager} from "./FontManager.js";
import {is_translation, TranslationManager} from "./translations.js"
// @ts-ignore
import {GRAPHICS} from 'idealos_schemas/js/graphics.js'
// @ts-ignore
import {WINDOWS} from "idealos_schemas/js/windows.js";
// @ts-ignore
import {DEBUG} from "idealos_schemas/js/debug.js";
// @ts-ignore
import {GENERAL} from "idealos_scemas/js/general.js";
// @ts-ignore
import {INPUT} from "idealos_schemas/js/input.js";

export const hostname = '127.0.0.1'
export const websocket_port = 8081

export class CentralServer {
    private websocket_port: number;
    private hostname: string;
    private app_manager: AppManager;
    private apps: any;
    // private audio: AudioService;
    // private db_json: string[];
    // @ts-ignore
    private _server: WebSocket.Server;
    // @ts-ignore
    private font_manager: FontManager;
    private translation_manager: TranslationManager;
    private theme_manager: ThemeManager;
    private kb: KeybindingsManager|undefined;
    constructor(opts:any) {
        this.log('starting with opts', opts)
        if (!opts.websocket_port) throw new Error("no webssocket port set!")
        this.websocket_port = opts.websocket_port
        this.hostname = opts.hostname

        if (!opts.apps) throw new Error("no applist provided")

        this.theme_manager = new ThemeManager(this,opts.themes,opts.uitheme)
        this.translation_manager = new TranslationManager(this,opts.translations)
        this.app_manager = new AppManager(this,this.hostname,this.websocket_port)
        this.apps = opts.apps
        this.font_manager = new FontManager(this)
        // this.audio = new AudioService(this)
        // this.db_json = opts.db_json || []
    }

    async start() {
        await this.font_manager.load()
        this.kb = new KeybindingsManager(this, {
            keybindings:await load_keybindings("resources/keybindings.json")
        })
        // this.db = new DataBase(this)
        // this.db.start()
        // this.db_json.forEach(path => this.db.watch_json(path))

        this._server = new WebSocket.Server({
            port: this.websocket_port
        })
        this.log(`started websocket port on ws://${hostname}:${websocket_port}`)
        this._server.on('connection', (ws) => {
            this.log("connection opened")
            ws.on("message", (m) => {
                // @ts-ignore
                let msg = JSON.parse(m)
                this.dispatch(msg, ws)
            })
            ws.on('close', (code) => {
                this.app_manager.handle_websocket_closed(ws)
            })
        })
        this._server.on("close", (m: any) => {
            this.log('server closed', m)
        })
        this._server.on('error', (e) => {
            this.log("server error", e)
        })

        for (let app of this.apps.system) {
            if(app.disabled !== true) await this.start_app(app)
        }
        for (let app of this.apps.user) {
            if (app.autostart) {
                await this.start_app(app)
            } else {
                await this.app_manager.create_app(app)
            }
        }

    }

    log(...args: (string | Error)[]) {
        console.log('CENTRAL',...args)
    }

    async start_app(opts: any) {
        let app = this.app_manager.create_app(opts)
        this.app_manager.start_app_by_id(app.id)
    }

    async start_app_cb(opts: any) {
        // let app = this.at.create_app(opts)
        // return {
        //     app: app,
        //     info: this.at.start_cb(app.id)
        // }
    }


    dispatch(msg: any, ws: WebSocket) {
        try {
            if(msg.type === 'APP_OPEN') return this.app_manager.app_connected(msg,ws)
            if(msg.type === 'MAKE_ScreenStart_name') return this.app_manager.screen_connected(msg,ws)

            if(msg.type === DEBUG.TYPE_ListAppsRequest)  return this.app_manager.handle_list_all_apps(msg)
            if(msg.type === "LIST_ALL_APPS") return this.app_manager.handle_list_all_apps2(msg)
            if(msg.type === DEBUG.TYPE_StartAppByName) return this.app_manager.start_app_by_name(msg)

            if(msg.type === "MAKE_SetMenubar_name") return this.app_manager.send_to_type("MENUBAR",msg )

            if(msg.type === WINDOWS.TYPE_WindowOpen) return this.app_manager.open_window(msg)
            if(msg.type === WINDOWS.TYPE_window_close_request)  return this.app_manager.send_to_app(msg.target,msg)
            if(msg.type === WINDOWS.TYPE_window_close_response)  return this.app_manager.close_window(msg)
            if(msg.type === 'request-font') return this.font_manager.request_font(msg)
            if(msg.type === WINDOWS.TYPE_window_refresh_request) return this.app_manager.send_to_target(msg)
            if(msg.type === WINDOWS.TYPE_WindowSetPosition) return this.app_manager.set_window_position(msg)
            if(msg.type === 'window-set-size') return this.app_manager.set_window_size(msg)
            if(is_translation(msg)) return this.translation_manager.handle(msg)
            if(is_theme(msg)) return this.theme_manager.handle(msg)
            if(msg.type === 'group-message') {
                if (msg.category === 'graphics') {
                    return this.app_manager.send_to_type("SCREEN",msg)
                }
            }
            if(msg.type === GRAPHICS.TYPE_DrawRect){
                return this.app_manager.send_to_type("SCREEN",msg)
            }
            if (msg.type === WINDOWS.TYPE_SetFocusedWindow) {
                return this.app_manager.set_focused_window(msg)
            }
            if(msg.type === INPUT.TYPE_MouseDown) {
                return this.app_manager.send_to_app(msg.target,msg)
            }
            if(msg.type === INPUT.TYPE_MouseUp) {
                return this.app_manager.send_to_app(msg.target,msg)
            }
            if(msg.type === INPUT.TYPE_KeyboardDown) {
                return this.app_manager.send_to_app(msg.target,msg)
            }
            console.log("===\nunhandled message\n===",msg.type)
            // this.router.route(ws, msg)
        } catch (e) {
            this.log(e)
        }
    }

     async shutdown() {
        await this._stop_websocket_server()
        // await this.db.stop()
    }

    _stop_websocket_server() {
        return new Promise<void>((res, rej) => {
            this._server.close(() => {
                // console.log('close is done')
                this.log("stopped messages")
                res()
            })
        })
    }

    async get_app_list() {
        // return this.at.list_apps()
    }

    // async stop_app(id) {
        // return this.at.stop(id)
    // }

    // start_app_by_id(id) {
        // return this.at.start(id)
    // }

}

async function load_checker(dir: string, schema_names: string[]) {
    const ajv = new Ajv()
    let ms = await fs.promises.readFile("node_modules/ajv/lib/refs/json-schema-draft-06.json")
    ajv.addMetaSchema(JSON.parse(ms.toString()))
    let _schemas = {}
    for (let name of schema_names) {
        // console.log(`loading ${name} from ${dir}`)
        let json = JSON.parse((await fs.promises.readFile(path.join(dir, name))).toString())
        ajv.addSchema(json)
        // @ts-ignore
        _schemas[name] = json
        // console.log("loading",name)
    }
    return {
        validate: function (json_data: any, schema_name: string | number) {
            // @ts-ignore
            if (!_schemas[schema_name]) throw new Error(`no such schema ${schema_name}`)
            // @ts-ignore
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
export async function load_applist(json_path: fs.PathLike | fs.promises.FileHandle) {
    let checker = await load_checker("resources/schemas", ["app.schema.json", "applist.schema.json"])
    let data = JSON.parse((await fs.promises.readFile(json_path)).toString())
    let result = checker.validate(data, "applist.schema.json")
    // if (result === false) { // @ts-ignore
    //     throw new Error(`error loading ${json_path} ${checker.errors}`)
    // }
    return data
}
export async function load_uitheme(json_path: fs.PathLike | fs.promises.FileHandle) {
    // let checker = await load_checker("resources/schemas", ["uitheme.schema.json"])
    let data = JSON.parse((await fs.promises.readFile(json_path)).toString())
    // let result = checker.validate(data, "uitheme.schema.json")
    // if (result === false) throw new Error(`error loading ${json_path} ${checker.errors}`)
    return data
}
export async function load_translation(json_path: fs.PathLike | fs.promises.FileHandle) {
    return JSON.parse((await fs.promises.readFile(json_path)).toString())
}
export async function load_keybindings(json_path: fs.PathLike | fs.promises.FileHandle) {
    return JSON.parse((await fs.promises.readFile(json_path)).toString())
}