import {CentralServer, load_applist} from '../src/server/server.ts'
import assert from 'assert'
import {sleep} from '../src/common.js'
import {HeadlessDisplay} from './common.js'
import {GENERAL} from 'idealos_schemas/js/general.js'
import {WINDOWS} from 'idealos_schemas/js/windows.js'
import {DEBUG} from 'idealos_schemas/js/debug.js'
import {GRAPHICS} from 'idealos_schemas/js/graphics.js'

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
    it("loads the doc", async function() {
        let applist = await load_applist("test/resources/good.applist.json")
        let server = new CentralServer({
            hostname:'127.0.0.1',
            websocket_port:8081,
            apps:applist,
        })
        try {
            await server.start()
            await sleep(500)
            await server.shutdown()
        } catch (e) {
            console.log(e)
            await server.shutdown()
        }

    })
})

describe("app launching",function() {
    it("starts and stops and restarts an app", async function() {
        let applist = await load_applist("test/resources/guitest.applist.json")
        let server = new CentralServer({
            hostname:'127.0.0.1',
            websocket_port:8081,
            apps:applist,
        })
        try {
            await server.start()
            //start display server
            let display = await new HeadlessDisplay(server.hostname, server.websocket_port)
            await display.wait_for_message(GENERAL.TYPE_Connected)
            await display.send(GENERAL.MAKE_ScreenStart())
            //wait for gui test to open the window
            await display.wait_for_message(WINDOWS.TYPE_WindowOpenDisplay)
            await sleep(250)

            //guitest is auto started
            let apps = await server.get_app_list()
            //get appid for guitest
            let appid = apps[0].id
            assert.strictEqual(apps[0].id,appid)
            assert.strictEqual(apps[0].running,true)


            async function stop_app_and_wait(appid) {
                //send shutdown request
                await server.stop_app(appid)
                console.log("app was shutdown")
                apps = await server.get_app_list()
                console.log("now applist is",apps)
                assert.strictEqual(apps[0].id,appid)
                assert.strictEqual(apps[0].running,false)
            }

            async function start_app_and_wait(appid) {
                //send startup request
                server.start_app_by_id(appid)
                //wait for app to startup
                await display.wait_for_message(DEBUG.TYPE_AppStarted)
                // console.log("app started")
                await display.wait_for_message(WINDOWS.TYPE_WindowOpenDisplay)
                // console.log("waiting for a draw command")
                await display.wait_for_message(GRAPHICS.TYPE_DrawRect)
                console.log("app drew a rectangle")
                // await sleep(500)
                apps = await server.get_app_list()
                console.log("now applist is",apps)
                assert.strictEqual(apps[0].id,appid)
                assert.strictEqual(apps[0].running,true)
            }

            await stop_app_and_wait(appid)
            await start_app_and_wait(appid)
            await stop_app_and_wait(appid)
            // await start_app_and_wait(appid)
            // await stop_app_and_wait(appid)

            //shut down everything
            await server.shutdown()
        } catch (e) {
            console.log(e)
            await server.shutdown()
            throw e
        }
    })
})
