import {start_message_server} from './server.js'

let server = start_message_server()
server.screen_connected().then(()=>{
    let apps = [
        {name:'dotclock', path:'src/clients/app1.js',args:[]},
        {name:'app2', path:'src/clients/app2.js',args:[]},
        {name:'guitest', path:'src/clients/gui_test.js',args:[]},
        {name:'fractal', path:'src/clients/fractal.js',args:[]},
        {name:'menubar', path:'src/clients/menubar.js',args:[]},
    ]

    console.log('starting apps',apps)
    for(let app of apps) {
        server.start_app(app)
    }
})

