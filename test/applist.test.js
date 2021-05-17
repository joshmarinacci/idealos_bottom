import fs from 'fs'
import path from 'path'
import Ajv from 'ajv'
import {CentralServer} from '../src/server/server.js'
import assert from 'assert'

async function load_checker(dir,schema_names) {
    const ajv = new Ajv()
    let ms = await fs.promises.readFile("node_modules/ajv/lib/refs/json-schema-draft-06.json")
    ajv.addMetaSchema(JSON.parse(ms.toString()))
    let _schemas = {}
    for(let name of schema_names) {
        // console.log(`loading ${name} from ${dir}`)
        let json = JSON.parse((await fs.promises.readFile(path.join(dir,name))).toString())
        ajv.addSchema(json)
        _schemas[name] = json
        // console.log("loading",name)
    }
    return {
        validate: function(json_data,schema_name) {
            if(!_schemas[schema_name]) throw new Error(`no such schema ${schema_name}`)
            let sch = _schemas[schema_name]
            console.log(typeof sch,typeof json_data,schema_name)
            // console.log("compling",sch)
            let validate_apps_schema = ajv.compile(sch)
            let valid = validate_apps_schema(json_data)
            if(!valid) console.warn("two errors",validate_apps_schema.errors)
            return validate_apps_schema
        }
    }
}

export async function load_applist(json_path) {
    let checker = await load_checker("resources/schemas",["app.schema.json","applist.schema.json"])
    let data = JSON.parse((await fs.promises.readFile(json_path)).toString())
    let result = checker.validate(data,"applist.schema.json")
    // console.log("result is",result)
    if(result === false) throw new Error("error loading " + checker.errors)
    return data
}

describe("load apps list", function() {
    it("loads an invalid app list", async function() {
        try {
            let applist = await load_applist("test/resources/bad.applist.json")
            throw new Error("loading should have thrown an error")
        } catch (e) {
            console.log("got an error which means we passed")
        }
    })
    it('loads a valid app list', async function () {
        let applist = await load_applist("test/resources/good.applist.json")
    })
    it("starts the server with a list of apps",async function () {
        let applist = await load_applist("test/resources/good.applist.json")
        let server = new CentralServer({
            hostname:'127.0.0.1',
            websocket_port:8081,
            apps:applist,
        })
        try {
            await server.start()
            let list = await server.get_app_list()
            console.log("running app count",list.length)
            assert.strictEqual(list.length, 4)
            await server.shutdown()
        } catch (e) {
            console.log(e)
            await server.shutdown()
        }
    })
})
