//parse schemas/menu.txt into src/schemas/menu.js


import fs from 'fs'
import path from 'path'

function log(...args) {
    console.log(...args)
}

class SrcOutput {
    constructor() {
        this.lines = []
        this.depth = 0
        this.tab = "    "
    }
    line(str) {
        let space = ""
        for(let i=0; i<this.depth; i++) {
            space += this.tab
        }
        this.lines.push(space+str)
    }
    toString() {
        return this.lines.join("\n")
    }

    indent() {
        this.depth++
    }

    outdent() {
        this.depth--
    }

    blank() {
        this.line("")
    }
}

async function process_schema(src, dst_js, dst_rs) {
    let namespace = path.basename(src,'.txt').toUpperCase()
    let schema = (await fs.promises.readFile(src)).toString()
    let lines = schema.split("\n")
    let defs = {}
    lines.forEach(line => {
        let [name, def_str] = line.split("=")
        if(!name)return
        name = name.trim()
        if(name.startsWith("@")) return
        let def_parts = def_str.trim().split(" ")
        let def_type = def_parts.shift()
        if(def_type === 'enum') {
            defs[name] = {
                type:'enum',
                enum_type:def_parts.shift(),
                values:def_parts.slice()
            }
        }
        if(def_type === 'array') {
            defs[name] = {
                type:'array',
                array_type:def_parts.shift(),
            }
        }
        if(def_type === 'map') {
            defs[name] = {
                type:'map',
                key_type:def_parts.shift(),
                value_type:def_parts.shift(),
            }
        }
        if(def_type === 'object') {
            let props = {}
            def_parts.forEach(pt => {
                let [key,value] = pt.split(":")
                props[key]= value
            })
            defs[name] = {
                type:'object',
                props:props
            }
        }
    })

    let js_output = make_js_output(namespace,defs)
    let dir = path.dirname(dst_js)
    fs.promises.mkdir(dir,{recursive:true})
    await fs.promises.writeFile(dst_js,js_output.toString())
    log("wrote to ",dst_js)


    let rs_output = make_rs_output(namespace,defs)
    // log("rust\n",rs_output.toString())
    let dir2 = path.dirname(dst_rs)
    await fs.promises.mkdir(dir2,{recursive:true})
    await fs.promises.writeFile(dst_rs,rs_output.toString())
    log('wrote to',dst_rs)
}

async function doit() {
    await process_schema('./tools/schemas/menus.txt',
        './src/schemas/menus_schemas.js',
        './clients/rust-screen/src/menus_schemas.rs')
    await process_schema('./tools/schemas/windows.txt',
        './src/schemas/windows_schemas.js',
        './clients/rust-screen/src/windows_schemas.rs')
    await process_schema('./tools/schemas/resources.txt',
        './src/schemas/resources_schemas.js',
        './clients/rust-screen/src/resources_schemas.rs')
    await process_schema('./tools/schemas/input.txt',
        './src/schemas/input_schemas.js',
        './clients/rust-screen/src/input_schemas.rs')
    await process_schema('./tools/schemas/general.txt',
        './src/schemas/general_schemas.js',
        './clients/rust-screen/src/general_schemas.rs')
    await process_schema('./tools/schemas/graphics.txt',
        './src/schemas/graphics_schemas.js',
        './clients/rust-screen/src/graphics_schemas.rs')
    await process_schema('./tools/schemas/debug.txt',
        './src/schemas/debug_schemas.js',
        './clients/rust-screen/src/debug_schemas.rs')
}

function make_js_output(namespace,defs) {
    let js_output = new SrcOutput()
    Object.keys(defs).forEach(target => {
        let def = defs[target]
        // log("generating code for",target, def)
        if(def.type === 'object') {
            js_output.line(`const TYPE_${target} = "MAKE_${target}_name"`)
            js_output.line(`function MAKE_${target}(data) {`)
            js_output.indent()
            js_output.line('let obj = {}')
            js_output.line(`obj.type = TYPE_${target}`)
            Object.entries(def.props).forEach(([name,type])=>{
                js_output.line(`if(!data.hasOwnProperty('${name}')) throw new Error("object '${target}' is missing property '${name}' ")`)
                js_output.line(`if(data.${name} === undefined) throw new Error("object '${target} has undefined property ${name}")`)
                if(type === 'string') {
                    js_output.line(`obj.${name} = data.${name}`)
                    js_output.blank()
                    return
                }
                if(type === 'number') {
                    js_output.line(`obj.${name} = data.${name}`)
                    js_output.blank()
                    return
                }
                js_output.line(`obj.${name} = MAKE_${type}(data.${name})`)
                js_output.blank()
            })
            js_output.line(`return obj`)
            js_output.outdent()
            js_output.line('}')
        }
        if(def.type === 'enum') {
            // log("making an enum def",def)
            js_output.line(`const TYPE_${target} = "MAKE_${target}_name"`)
            js_output.line(`export function MAKE_${target}(value) {`)
            js_output.indent()
            def.values.forEach(val => {
                js_output.line(`if(value === ${val}) return value`)
            })
            js_output.line(`throw new Error("MAKE_${target}: invalid value"+value)`)
            js_output.outdent()
            js_output.line("}")
        }
        if(def.type === 'array') {
            // log("making array def", def)
            js_output.line(`const TYPE_${target} = "MAKE_${target}_name"`)
            js_output.line(`export function MAKE_${target}(arr) {`)
            js_output.indent()
            js_output.line("return arr")
            js_output.outdent()
            js_output.line("}")
        }
        if(def.type === 'map') {
            // log("making JS map def", def)
            js_output.line(`const TYPE_${target} = "MAKE_${target}_name"`)
            js_output.line(`export function MAKE_${target}(map) {`)
            js_output.indent()
            js_output.line("return map")
            js_output.outdent()
            js_output.line("}")
        }
    })

    js_output.line(`export const ${namespace} = {`)
    js_output.indent()
    Object.keys(defs).forEach(target => {
        js_output.line(`MAKE_${target} : MAKE_${target},`)
        js_output.line(`TYPE_${target} : TYPE_${target},`)
    })

    js_output.outdent()
    js_output.line("}")
    return js_output
}

function make_rs_output(namespace, defs) {
    let rs_output = new SrcOutput()
    rs_output.line("use std::collections::HashMap;\n" +
        "use serde::{Deserialize, Serialize};\n")
    Object.keys(defs).forEach(target => {
        let def = defs[target]
        if(def.type === 'object') {
            // console.log("doing rust target",target, '=', def)
            rs_output.line(`pub const ${target}_name: &str = "MAKE_${target}_name";`)

            rs_output.line("#[derive(Serialize, Deserialize, Debug)]")
            rs_output.line(`pub struct ${target} {`)
            rs_output.indent()
            rs_output.line('#[serde(rename = "type")]')
            rs_output.line(`pub type_:String,`)
            Object.entries(def.props).forEach(([name,type])=> {
                // console.log(name,type)
                if(name === 'type') {
                    rs_output.line('#[serde(rename = "type")]')
                    name = '_type'
                }
                if(type === 'string') type = 'String'
                if(type === 'number') type = 'i64'
                rs_output.line(`pub ${name}:${type},`)
            })
            rs_output.outdent()
            rs_output.line("}")
        }
        if(def.type === 'enum') {
            // console.log("doing rust enum",target,'=',def)
            rs_output.line("#[derive(Serialize, Deserialize, Debug)]")
            rs_output.line(`pub enum ${target} { }`)
        }
        if(def.type === 'array') {
            // console.log("doing rust array",target,'=',def)
            let array_type = def.array_type
            if(array_type === 'string') array_type = 'String'
            rs_output.line(`pub type ${target} = Vec<${array_type}>;`);
        }
        if(def.type === 'map') {
            // console.log("doing rust output map",target,'=',def)
            let key_type = def.key_type
            let value_type = def.value_type
            if(key_type === 'string') key_type = 'String'
            if(value_type === 'string') value_type = 'String'
            rs_output.line(`pub type ${target} = HashMap<${key_type},${value_type}>;`)
        }
    })
    return rs_output
}

doit().then(()=>console.log("finished generating schemas"));