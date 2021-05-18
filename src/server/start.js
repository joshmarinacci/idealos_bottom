import {CentralServer, load_applist, load_uitheme} from './server.js'

async function doit() {
    let applist = await load_applist("resources/apps.json")
    let uitheme = await load_uitheme("resources/uitheme.json")
    let server = new CentralServer({
        hostname:'127.0.0.1',
        websocket_port:8081,
        apps:applist,
        uitheme:uitheme,
    })

    await server.start()
}

doit().catch(e => console.error(e))
