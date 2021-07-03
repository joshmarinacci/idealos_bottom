import {CentralServer, load_applist, load_translation, load_uitheme} from "./server.js"
// @ts-ignore
import fs from 'fs'

async function doit() {
    let applist = await load_applist("resources/apps.json")
    let uitheme_light = await load_uitheme("resources/uitheme.json")
    let uitheme_dark = await load_uitheme("resources/uitheme-dark.json")
    let base_translation = await load_translation("resources/translations/base.json")
    let lolcat_translation = await load_translation("resources/translations/lolcat.json")
    let fonts = {
        base: JSON.parse((await fs.promises.readFile("resources/fonts/font.json")).toString())
    }
    let db_json = [
        "resources/database/tasks.json"
    ]

    let server = new CentralServer({
        hostname:'127.0.0.1',
        websocket_port:8081,
        apps:applist,
        themes:{
            'light':uitheme_light,
            'dark':uitheme_dark,
        },
        fonts:fonts,
        screens:[
            {
                width:250,
                height:250,
            }
        ],
        translations:[base_translation,lolcat_translation],
        db_json:db_json
    })

    await server.start()
}

doit().catch(e => console.error(e))