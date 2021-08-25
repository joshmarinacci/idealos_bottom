import {CentralServer} from "../server.js";
import {DataBase} from "./db.js";

export const DATABASE_GROUP = {
    "database-query":"database-query",
    "database-watch":"database-watch",
    "database-add":"database-add",
    "database-update":"database-update"
}

export class DBService {
    private server: CentralServer;
    private db: DataBase;
    constructor(server:CentralServer) {
        this.server = server
        this.db = new DataBase()
    }
    log(...args) {
        console.log("DBService:",...args)
    }
    is_database(msg: any) {
        return Object.values(DATABASE_GROUP).some(n => msg.type === n)
    }
    handle(msg) {
        this.log("hanlding", msg)
        if(msg.type === "database-query") return this.perform_database_query(msg)
        if(msg.type === "database-watch") return this.perform_database_watch(msg)
        if(msg.type === "database-add")   return this.perform_database_add(msg)
        if(msg.type === "database-update")return this.perform_database_update(msg)
    }

    perform_database_query(msg) {
        console.log("searching database for", msg.query)
        let res = this.db.QUERY(msg.query)
        console.log("result is", res.length)
        this.server.app_manager.send_to_app(msg.app, {
            type: "database-query-response",
            app: msg.app,
            docs: res,
        })
    }
    perform_database_watch(msg) {
        let cb = (obj)=>{
            console.log("db changed with object",msg.category,obj)
            this.server.app_manager.send_to_app(msg.app,{
                type:"database-watch-update",
                app:msg.app,
                object:obj,
            })
        }
        // @ts-ignore
        cb.app = msg.app
        this.db.addEventListener(msg.category,cb)
    }
    perform_database_add(msg) {
        if (!msg.object.type) return console.error("cannot add object. missing type")
        if (!msg.object.category) return console.error("cannot add object. missing category")
        if (msg.object.id) return console.error('cannot add object, already has an id')
        this.log('adding', msg.object)
        this.db.add_object(msg.object).then((obj)=>{
            this.log("really added",obj.id)
        })
    }
    perform_database_update(msg) {
        let obj = this.db.findObject(msg.object.id)
        Object.entries(msg.object.props).forEach(([key,value])=>{
            this.db.setProp(obj,key,value)
        })
    }

    remove_app_listeners(app) {
        Object.values(this.db.listeners).forEach(lists => {
            let n = lists.findIndex(cb => cb.app === app.id)
            if(n >= 0) {
                lists.splice(n,1)
            }
        })
        console.log("total db listeners",this.db.calc_total_listeners())
    }

    async start() {
        await this.db.start()
    }
    async load_json(path: string) {
        await this.db.load_json(path)
    }
    async stop() {
        await this.db.stop()
    }
}
