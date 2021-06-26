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

// export function project(items,propsarray=[]) {
//     return items.map(o => {
//         let oo = {
//             id:Math.floor(Math.random()*1000*1000),
//             props:{}
//         }
//         propsarray.forEach(p=>{
//             if(hasProp(o,p)) {
//                 oo.props[p] = o.props[p]
//             }
//         })
//         return oo
//     })
// }

// export function propAsString(s, key) {
//     if(!s) return "--missing--"
//     if(!s.props) {
//         if(s.hasOwnProperty(key)) {
//             return s[key]
//         }
//         return 'no props'
//     }
//     if(s.props.hasOwnProperty(key)) {
//         let v = s.props[key]
//         if(v === true) return "true"
//         if(v === false) return "false"
//     } else {
//         return ""
//     }
//     if(s.props[key] instanceof Date) return s.props[key].toISOString()
//     return s.props[key]
// }


// export function setProp(obj,key,value) {
//     if(!obj) return
//     if(!obj.hasOwnProperty('props')) {
//         if(obj.hasOwnProperty(key)) {
//             obj[key] = value
//             return
//         }
//         return
//     }
//     obj.props[key] = value
//     obj.local = true
// }

// export function hasProp(s,key) {
//     return s && s.props && s.props.hasOwnProperty(key)
// }

// export function propAsBoolean(s, key) {
//     if(!s || !s.props) return false
//     if(!(key in s.props))   return false
//     return Boolean(s.props[key]).valueOf()
// }

// export function stringAsBoolean(str) {
//     if(str.toLowerCase() === 'false') return false
//     if(str.toLowerCase() === 'on') return true
//     return true
// }

// export function propAsArray(s, key) {
//     if(!s || !s.props || !s.props.hasOwnProperty(key)) return []
//     let arr = s.props[key]
//     if(Array.isArray(arr)) {
//         return arr
//     } else {
//         return []
//     }
// }

// export function propAsDate(s, key) {
//     if(!s) return Date.now()
//     if(!s.props) return Date.now()
//     if(s.props[key] instanceof Date) return s.props[key]
//     console.warn("property value not a date",s.props[key])
//     return Date.now()
// }


// export function filter(list,opts) {
//     return list.filter(o => {
//         let pass = true
//         Object.keys(opts).forEach(k=>{
//             let fv = opts[k]
//             // console.log("key",k,o.props[k],'value',v)
//             if(!o.props.hasOwnProperty(k)) {
//                 pass = false
//                 return
//             }
//             let ov = o.props[k]
//             if(Array.isArray(ov)) {
//                 if(ov.length !== fv.length) {
//                     pass = false
//                     return
//                 }
//                 for(let i=0; i<ov.length; i++) {
//                     if(ov[i] !== fv[i]) {
//                         pass = false
//                         return
//                     }
//                 }
//             } else {
//                 if (ov !== fv) {
//                     pass = false
//
//                 }
//             }
//             // console.log("matched")
//         })
//         return pass
//     })
// }
// export function filterSubstring(list,opts) {
//     return list.filter(o => {
//         let pass = true
//         Object.keys(opts).forEach(k=>{
//             let fv = opts[k]
//             if(!o.props.hasOwnProperty(k)) {
//                 pass = false
//                 return
//             }
//             let ov = o.props[k]
//             if (!ov.toLowerCase().includes(fv.toLowerCase())) {
//                 pass = false
//
//             }
//         })
//         return pass
//     })
// }
//
// export function filterPropArrayContains(list,opts) {
//     return list.filter(o => {
//         let pass = true
//         Object.keys(opts).forEach(k=>{
//             let fv = opts[k]
//             if(!o.props.hasOwnProperty(k)) {
//                 pass = false
//                 return
//             }
//             let ov = o.props[k]
//             if(!Array.isArray(ov)) {
//                 pass = false
//                 return
//             }
//             if(!ov.includes(fv)) {
//                 pass = false
//
//             }
//         })
//         return pass
//     })
//
// }

// export function find_in_collection(coll,data) {
//     return data.filter(o => coll.props.set.some(id=>id===o.id))
// }
//
// export function deepClone(v) {
//     return JSON.parse(JSON.stringify(v))
// }

// export function attach(A, B, ka, kb) {
//     let data = deepClone(A)
//     data.forEach(a => {
//         B.forEach(b => {
//             let av = a.props[ka]
//             let bv = b.props[kb]
//             if(kb === 'id') bv = b.id
//             // p("comparing",av,bv)
//             if(av === bv) {
//                 // console.log("found a match")
//                 a.props[ka] = b
//             }
//         })
//     })
//     return data
// }

// export function attach_in(A, B, ka, kb) {
//     let data = deepClone(A)
//     data.forEach(a => {
//         a.props[ka] = a.props[ka].map(av => {
//             let ret = null
//             B.forEach(b => {
//                 let bv = b.props[kb]
//                 if(kb === 'id') bv = b.id
//                 if(av === bv) ret = b
//             })
//             return ret
//         })
//     })
//     return data
// }


// const ROOT_KEY = "query_lang_root_key"
export class DataBase {
    log(...args) {
        console.log("DB:",...args)
    }
    constructor(server) {
        // this._original_data = data
        this.data = []
        this.log("making database")
        this.object_cache = {}
        this.listeners = {}
        this.scm = new SchemaManager()
        // Object.keys(CATEGORIES).forEach(cat => this.listeners[cat] = [])
        // this.loadPresetData()
        // this.loadLocalStorage()
        // this.validateData()

        this.file_watchers = []
        this.server = server
    }


    async watch_json(file) {
        const refresh_file = async () => {
            let raw = await fs.promises.readFile(file)
            let json = JSON.parse(raw.toString())
            this.data = []
            json.forEach(item => {
                // this.log("checking item",item)
                if(!this.scm.isValid(item)) {
                    this.log("invalid item",item)
                } else {
                    this.data.push(item)
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
        return query(this.data,...args)
    }
    add(obj) {
        this.data.push(obj)
        obj.local = true
        obj.createdtime = new Date()
        obj.modifiedtime = new Date()
        this._fireUpdate(obj)
    }
    bulk_add(objs, cat) {
        let now = new Date()
        objs.forEach(obj => {
            this.data.push(obj)
            obj.local = true
            obj.createdtime = now
            obj.modifiedtime = now
        })
        this.listeners[cat].forEach(l => l())
    }
    remove(obj) {
        obj.removedtime = new Date()
        this.data = this.data.filter(d => d.id !== obj.id)
        this._fireUpdate(obj)
    }
    make(category,type, customSchema) {
        return makeNewObject(type,category, customSchema)
    }
    findObject(id) {
        return this.object_cache[id]
    }
    setProp(obj,key,value) {
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
        if(!obj.category) {
            console.warn("object missing category")
            return
        }
        this.listeners[obj.category].forEach(l => l(obj))
    }

    // loadPresetData() {
    //     this.data = this._original_data.slice()
    //     this.data.forEach(item => {
    //         item.local = false
    //         item.createdtime = new Date()
    //         item.modifiedtime = new Date()
    //         this.object_cache[item.id] = item
    //     })
    // }

    // loadLocalStorage(key) {
    //     if(!key) key = ROOT_KEY
    //     this.log(`loading local storage from ${key}`)
    //     if(localStorage.getItem(key)) {
    //         let localJSON = localStorage.getItem(key)
    //         // console.log("local is",localJSON)
    //         let local = JSON.parse(localJSON,function(key,value) {
    //             if(key === 'props') return decode_props_with_types(value);
    //             return value
    //         })
    //
    //         // console.log("local data is",local)
    //         local.forEach(item => {
    //             this.data.push(item)
    //             this.object_cache[item.id] = item
    //         })
    //     } else {
    //         this.log("no local storage present")
    //     }
    // }
    // clearLocalStorage(key) {
    //     if(!key) key = ROOT_KEY
    //     localStorage.removeItem(key)
    // }
    // validateData() {
    //     validateData(this.data)
    //     this.data = Object.values(this.object_cache).slice()
    //     this.log("total object count",this.data.length)
    //     this.log("total unique count", Object.keys(this.object_cache).length)
    // }

    // persist(key) {
    //     if(!key) key = ROOT_KEY
    //     this.log(`persisting data to ${key}`)
    //     let preset = this.data.filter(i => i.local === false)
    //     let local = this.data.filter(i => i.local === true)
    //     this.log(`preset items ${preset.length}`)
    //     this.log(`local items ${local.length}`)
    //     this.log(`total item count ${this.data.length}`)
    //     this.log("local items")
    //     local.forEach(item => this.log("    ",item))
    //     localStorage.setItem(key,JSON.stringify(local,function(key,value){
    //         if(key === 'props') return encode_props_with_types(value)
    //         return value
    //     }))
    // }
    persist_to_plainobject() {
        let local = this.data.filter(i => i.local === true)
        let str = JSON.stringify(local,function(key,value){
            if(key === 'props') return encode_props_with_types(value)
            return value
        })
        return JSON.parse(str)
    }
    // reload(key) {
    //     this.object_cache = {}
    //     this.loadPresetData(this._original_data)
    //     this.loadLocalStorage(key)
    //     this.validateData()
    //     this._fireUpdateAll()
    // }
    // nukeAndReload(key) {
    //     console.log("nuking and reloading " + key)
    //     this.object_cache = {}
    //     this.clearLocalStorage(key)
    //     this.loadPresetData(this._original_data)
    //     this.loadLocalStorage(key)
    //     this.validateData()
    //     this._fireUpdateAll()
    // }
    // nuke_and_reload_from_plainobject(obj) {
    //     // console.log("nuking and reloading " + obj)
    //     this.object_cache = {}
    //     this.loadPresetData(this._original_data)
    //     console.log("loading in data ",obj)
    //     let str = JSON.stringify(obj)
    //     let local = JSON.parse(str,function(key,value) {
    //         if(key === 'props') return decode_props_with_types(value);
    //         return value
    //     })
    //
    //     console.log("new local data is",local)
    //     local.forEach(item => {
    //         this.data.push(item)
    //         this.object_cache[item.id] = item
    //     })
    //
    //     this.validateData()
    //     this._fireUpdateAll()
    // }

    _fireUpdateAll() {
        Object.values(this.listeners).forEach(category => category.forEach(listener => listener()))
    }

    perform_database_query(msg) {
        // console.log("searching database for",msg.query)
        let res = this.QUERY(msg.query)
        // console.log("result is",res.length)
        this.server.cons.forward_to_app(msg.app,{
            type:"database-query-response",
            app:msg.app,
            docs:res,
        })
    }

    perform_database_watch(msg) {
        this.addEventListener(msg.category,(obj)=>{
            // console.log("db changed with object",msg.category,obj)
            this.server.cons.forward_to_app(msg.app,{
                type:"database-watch-update",
                app:msg.app,
                object:obj,
            })
        })
    }
    perform_database_add(msg) {
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


export async function makeDB_with_json_files(files) {
    let data = []
    for(let file of files) {
        let raw = await fs.promises.readFile(file)
        let json = JSON.parse(raw.toString())
        data.push(...json)
    }
    return new DataBase(data)
}


// TODO: extend this to use the real schemas
function encode_props_with_types(value) {
    let props = {}
    Object.keys(value).forEach(k => {
        let prefix = ''
        let val = value[k]
        if(value[k] instanceof Date) {
            prefix = '_date_'
            val = val.toISOString()
        }
        props[prefix+k] = val
    })
    return props
}

function decode_props_with_types(value) {
    let props = {}
    Object.keys(value).forEach(k => {
        if(k.startsWith('_date_')) {
            let k2 = k.replace('_date_','')
            props[k2] = new Date(value[k])
        } else {
            props[k] = value[k]
        }
    })
    return props
}
