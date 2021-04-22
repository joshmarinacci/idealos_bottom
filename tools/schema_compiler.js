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
    let schema = (await fs.promises.readFile(src)).toString()
    console.log("schema",schema)
    let lines = schema.split("\n")
    let defs = {}
    let gen_targets = []
    lines.forEach(line => {
        let [name, def_str] = line.split("=")
        if(!name)return
        name = name.trim()
        if(name === '@GEN') {
            gen_targets.push(def_str.trim())
            return
        }
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
    log("final defs",defs)
    log("gen targets",gen_targets)

    let js_src = ''
    let output = new SrcOutput()
    Object.keys(defs).forEach(target => {
        let def = defs[target]
        // log("generating code for",target, def)
        if(def.type === 'object') {
            output.line(`function MAKE_${target}(data) {`)
            output.indent()
            output.line('let obj = {}')
            Object.entries(def.props).forEach(([name,type])=>{
                output.line(`if(!data.hasOwnProperty('${name}')) throw new Error("object '${target}' is missing property '${name}' ")`)
                if(type === 'string') {
                    output.line(`obj.${name} = data.${name}`)
                    output.blank()
                    return
                }
                output.line(`obj.${name} = MAKE_${type}(data.${name})`)
                output.blank()
            })
            output.line(`return obj`)
            output.outdent()
            output.line('}')
        }
        if(def.type === 'enum') {
            // log("making an enum def",def)
            output.line(`export function MAKE_${target}(value) {`)
            output.indent()
            def.values.forEach(val => {
                output.line(`if(value === ${val}) return value`)
            })
            output.line(`throw new Error("MAKE_${target}: invalid value"+value)`)
            output.outdent()
            output.line("}")
        }
        if(def.type === 'array') {
            log("making array def", def)
            /*
            make_thing_array(arr) {
                if(typeof arr !== 'array') throw
                return arr
            }
             */
            output.line(`export function MAKE_${target}(arr) {`)
            output.indent()
            output.line("return arr")
            output.outdent()
            output.line("}")
        }
    })

    output.line("export const MENUS = {")
    output.indent()
    Object.keys(defs).forEach(target => {
        output.line(`MAKE_${target} : MAKE_${target},`)
    })

    output.outdent()
    output.line("}")
    // log("final source is\n",output.toString())
    let dir = path.dirname(dst_js)
    log("Dir is",dir)
    fs.promises.mkdir(dir,{recursive:true})
    await fs.promises.writeFile(dst_js,output.toString())
    log("wrote to ",dst_js)
}

async function doit() {
    await process_schema('./tools/schemas/menus.txt',
        './src/schemas/menus_schemas.js',
        './menus_schemas.rs')
}

doit().then(()=>console.log("finished generating schemas"));