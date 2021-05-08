import {start_message_server} from './server.js'

async function doit() {
    let server = await start_message_server()
    let apps = [
        {name:'dotclock', path:'src/clients/app1.js',args:[]},
        {name:'app2', path:'src/clients/app2.js',args:[]},
        {name:'guitest', path:'src/clients/gui_test.js',args:[]},
        {name:'fractal', path:'src/clients/fractal.js',args:[]},
        {name:'menubar', path:'src/clients/menubar.js',args:[]},
        {name:'dock', path:'src/clients/dock.js',args:[]},
    ]

    console.log('starting apps',apps)
    for(let app of apps) {
        await server.start_app(app)
    }
}

doit().catch(e => console.error(e))
