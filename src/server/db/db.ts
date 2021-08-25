import {query} from './query.js'
import {CATEGORIES, SchemaManager, SORTS} from './schema.js'
import {compareAsc, compareDesc} from "date-fns/index.js"
import fs from 'fs'
import {genid} from "../../common.js";
import path from "path";



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
    // private server: CentralServer;
    private data_file_contents: Map<string, any[]>;
    private scm: SchemaManager;
    private object_cache: Map<string, any>;
    private changes_dir: string;
    private changed_data:any[];
    listeners: Map<string, any[]>;
    log(...args) {
        console.log("DB:",...args)
    }
    constructor() {
        this.changes_dir = "./resources/database/changes"

        this.data_file_contents = new Map<string,any[]>()
        this.changed_data = []
        this.object_cache = new Map<string,any>()
        this.listeners = new Map<string,any[]>()
        this.scm = new SchemaManager()
    }

    async start() {
        this.log("starting")
        let files = await fs.promises.readdir(this.changes_dir)
        for(let f of files) {
            let pth = path.join(this.changes_dir,f)
            let objs = await this.load_json(pth)
            objs.forEach(obj => this.changed_data.push(obj))
        }
    }


    flat_data() {
        return Array.from(this.object_cache.values())
    }

    set_changes_dir(dir:string) {
        this.changes_dir = dir
    }

    async load_json(json_file_path:string):Promise<any[]> {
        try {
            let raw = await fs.promises.readFile(json_file_path)
            let json = JSON.parse(raw.toString())
            this.data_file_contents[json_file_path] = []
            let added:any[] = []
            json.forEach(obj => {
                if(!this.scm.isValid(obj)) {
                    this.log("invalid item",obj)
                } else {
                    this.data_file_contents[json_file_path].push(obj)
                    added.push(obj)
                    this.object_cache.set(obj.id,obj)
                }
            })
            // this._fireUpdateAll()

            this.log("loading",json_file_path)
            return added
        } catch(e) {
            this.log(e)
            return []
        }

    }
    private async save_changes() {
        let changes_file = path.join(this.changes_dir,'changes.json')
        let str = JSON.stringify(this.changed_data,null,'    ')
        await fs.promises.writeFile(changes_file,str)
    }

    async stop() {
        this.log("stopping")
        this.changed_data = []
        this.object_cache = new Map<string, any>()
        this.data_file_contents = new Map<string, any[]>()
    }


    addEventListener(cat,listener) {
        if(!cat) throw new Error("Missing category")
        if(!this.listeners.has(cat)) this.listeners.set(cat,[])
        this.listeners.get(cat).push(listener)
        console.log("total db listeners",this.calc_total_listeners())
    }
    removeEventListener(cat,listener) {
        if(!cat) throw new Error("Missing category")
        this.listeners.set(cat, this.listeners.get(cat).filter(l => l !== listener))
    }
    QUERY(...args) {
        return query(this.flat_data(),...args)
    }

    async add_object(obj:any) {
        if(!obj.hasOwnProperty('id')) obj.id = genid("added")
        this.log("adding object w/ id",obj.id)
        obj.createdtime = new Date()
        obj.modifiedtime = new Date()
        this.changed_data.push(obj)
        this.object_cache.set(obj.id,obj)
        await this.save_changes()
        this._fireUpdate(obj)
        return obj
    }

    findObject(id) {
        return this.object_cache.get(id)
    }
    async setProp(obj, key, value) {
        this.log("setting", key, 'to', value, 'on', obj)
        if (!obj) return
        if (!obj.hasOwnProperty('props')) {
            if (obj.hasOwnProperty(key)) {
                obj[key] = value
                return
            }
            return
        }
        if (!obj.props.hasOwnProperty(key)) {
            console.warn("trying to set unknown property", key)
        }
        obj.props[key] = value
        obj.local = true
        obj.modifiedtime = new Date()
        await this.save_changes()
        this.changed_data.push(obj)
        this._fireUpdate(obj)
    }

    _fireUpdate(obj) {
        if(!obj) return this.log("can't update an empty object",obj)
        if(!obj.category) return this.log("object missing category")
        if(this.listeners.has(obj.category)) this.listeners.get(obj.category).forEach(l => l(obj))
        // if(this.listeners[obj.category]) this.listeners[obj.category].forEach(l => l(obj))
    }

    _fireUpdateAll() {
        Array.from(this.listeners.values()).forEach(list => list.forEach(l => l()))
        // Object.values(this.listeners).forEach(category => category.forEach(listener => listener()))
    }

    calc_total_listeners() {
        let total = 0
        Array.from(this.listeners.values()).forEach(ls => total+=ls.length)
        return total
    }
}
