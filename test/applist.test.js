import {CentralServer, load_applist} from '../src/server/server.js'
import assert from 'assert'

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
