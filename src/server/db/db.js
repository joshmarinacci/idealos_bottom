import {query} from './query.js'
import {CATEGORIES, SchemaManager, SORTS} from './schema.js'
import {compareAsc, compareDesc} from "date-fns/index.js"
import fs from 'fs'


export const DATABASE_GROUP = {
    "database-query":"database-query",
    "database-watch":"database-watch",
    "database-add":"database-add",
    "database-update":"database-update"
}

export function is_database(msg) {
    return Object.values(DATABASE_GROUP).some(n => msg.type === n)
}

export function sort(items,sortby,sortorder) {
    if(!Array.isArray(sortby)) throw new Error("sort(items, sortby) sortby must be an array of key names")
    items = items.slice()
    items.sort((A,B)=>{
        let key = sortby[0]
        let a = A.props[key]
        let b = B.props[key]
        // console.log("a,b",key,A,B,a,b)

        //date sort
        // console.log("is date",a instanceof Date)
        if(a instanceof Date) {
            if(sortorder === SORTS.DESCENDING) {
                return compareDesc(a,b)
            } else {
                return compareAsc(a,b)
            }
        }

        if(sortorder === SORTS.DESCENDING) {
            if (A.props[key] === B.props[key]) return 0
            if (A.props[key] < B.props[key]) return 1
            return -1
        } else {
            if (A.props[key] === B.props[key]) return 0
            if (A.props[key] > B.props[key]) return 1
            return -1
        }
    })
    return items
}

export class DataBase {
    log(...args) {
        console.log("DB:",...args)
    }
    constructor(server) {
        // this._original_data = data
        this.data_file_contents = {}
        this.changed_data = []
        this.log("making database")
        this.object_cache = {}
        this.listeners = {}
        this.scm = new SchemaManager()
        this.file_watchers = []
        this.server = server
    }

    flat_data() {
        return Object.values(this.object_cache)
    }


    async watch_json(file) {
        const refresh_file = async () => {
            this.log("file changed on disk",file)
            let raw = await fs.promises.readFile(file)
            let json = JSON.parse(raw.toString())
            this.data_file_contents[file] = []
            json.forEach(item => {
                if(!this.scm.isValid(item)) {
                    this.log("invalid item",item)
                } else {
                    this.data_file_contents[file].push(item)
                    this.object_cache[item.id] = item
                }
            })
            this._fireUpdateAll()
        }
        try {
            await refresh_file()
            this.file_watchers.push(fs.watch(file,()=>refresh_file()))
            this.log("watching",file)
        } catch(e) {
            this.log(e)
        }
    }

    async start() {

    }
    async stop() {
        this.file_watchers.forEach(fw => fw.close())
    }
    addEventListener(cat,listener) {
        if(!cat) throw new Error("Missing category")
        if(!this.listeners[cat]) this.listeners[cat] = []
        this.listeners[cat].push(listener)
    }
    removeEventListener(cat,listener) {
        if(!cat) throw new Error("Missing category")
        this.listeners[cat] = this.listeners[cat].filter(l => l !== listener)
    }
    QUERY(...args) {
        return query(this.flat_data(),...args)
    }
    add(obj) {
        this.changed_data.push(obj)
        this.object_cache[obj.id] = obj
        obj.local = true
        obj.createdtime = new Date()
        obj.modifiedtime = new Date()
        this._fireUpdate(obj)
    }

    findObject(id) {
        return this.object_cache[id]
    }
    setProp(obj,key,value) {
        // this.log("setting",key,'to',value,'on',obj)
        if(!obj) return
        if(!obj.hasOwnProperty('props')) {
            if(obj.hasOwnProperty(key)) {
                obj[key] = value
                return
            }
            return
        }
        if(!obj.props.hasOwnProperty(key)) {
            console.warn("trying to set unknown property",key)
        }
        obj.props[key] = value
        obj.local = true
        obj.modifiedtime = new Date()
        this._fireUpdate(obj)
    }

    _fireUpdate(obj) {
        if(!obj) return console.error("can't update an empty object",obj)
        if(!obj.category) {
            console.warn("object missing category")
            return
        }
        if(this.listeners[obj.category]) this.listeners[obj.category].forEach(l => l(obj))
    }

    _fireUpdateAll() {
        Object.values(this.listeners).forEach(category => category.forEach(listener => listener()))
    }

    perform_database_query(msg) {
        // console.log("searching database for",msg.query)
        let res = this.QUERY(msg.query)
        // console.log("result is",res.length)
        this.server.app_manager.send_to_app(msg.app,{
            type:"database-query-response",
            app:msg.app,
            docs:res,
        })
    }

    perform_database_watch(msg) {
        this.addEventListener(msg.category,(obj)=>{
            // console.log("db changed with object",msg.category,obj)
            this.server.app_manager.send_to_app(msg.app,{
                type:"database-watch-update",
                app:msg.app,
                object:obj,
            })
        })
    }
    perform_database_add(msg) {
        if(!msg.object.type) return console.error("cannot add object. missing type")
        if(!msg.object.category) return console.error("cannot add object. missing category")
        if(msg.object.id) return console.error('cannot add object, already has an id')
        msg.object.id = "obj"+Math.floor(Math.random()*10000)
        this.log('adding',msg.object)
        this.add(msg.object)
    }
    perform_database_update(msg) {
        let obj = this.findObject(msg.object.id)
        Object.entries(msg.object.props).forEach(([key,value])=>{
            this.setProp(obj,key,value)
        })
    }

    handle(msg) {
        if(msg.type === "database-query") return this.perform_database_query(msg)
        if(msg.type === "database-watch") return this.perform_database_watch(msg)
        if(msg.type === "database-add")   return this.perform_database_add(msg)
        if(msg.type === "database-update")return this.perform_database_update(msg)
    }
}
