/*
* time and date
* muisc player
* cpu info
* weather
* notifications
 */

import {App, Component} from '../toolkit/guitoolkit.js'
import {VBox} from '../toolkit/panels.js'
import {Container} from '../toolkit/guitoolkit.js'
import {WINDOWS} from 'idealos_schemas/js/windows.js'
import {GRAPHICS} from 'idealos_schemas/js/graphics.js'
import {INPUT} from 'idealos_schemas/js/input.js'

let app = new App(process.argv)


class NotificationsPanel extends Component {
}

async function init() {
    await app.a_init()
    // await app.send({ type:"SIDEBAR_START", })
    let win = await app.open_window(50,50,82,200,'sidebar')
    win.root = new VBox({width:82, height:300, children:[
            // new NotificationsPanel(),
        ]})

    let widgets = {}

    function redispatch(m) {
        if(m.type === 'MAKE_DrawRect_name') {
            let offset = widgets[m.app]
            app.send({
                type:m.type,
                window:win._winid,
                color:m.color,
                x:m.x+offset.x,
                y:m.y+offset.y,
                width:m.width,
                height:m.height,
            })
        }
        if(m.type === GRAPHICS.TYPE_DrawPixel) {
            let offset = widgets[m.app]
            app.send({
                type:m.type,
                window:win._winid,
                color:m.color,
                x:m.x+offset.x,
                y:m.y+offset.y,
            })
        }
        if(m.type === GRAPHICS.TYPE_DrawImage) {
            let offset = widgets[m.app]
            app.send({
                type:m.type,
                window:win._winid,
                color:m.color,
                x:m.x+offset.x,
                y:m.y+offset.y,
                width:m.width,
                height:m.height,
                pixels:m.pixels,
            })
        }
        if(m.type === "group-message") {
            // console.log("got a group",m)
            m.messages.forEach(msg2 => {
                msg2.app = m.app
                // msg2.trigger = msg.trigger
                redispatch(msg2)
            })
        }
    }
    app.on('MAKE_DrawRect_name',(m)=>redispatch(m.payload))
    app.on(GRAPHICS.TYPE_DrawPixel,(m)=>redispatch(m.payload))
    app.on(GRAPHICS.TYPE_DrawImage,(m)=>redispatch(m.payload))
    app.on("group-message",m => redispatch(m.payload))

    function forward_to_widget(m,wid) {
        let msg = m.payload
        msg.window = wid.windows[0]
        msg.x = Math.floor(msg.x - wid.x)
        msg.y = Math.floor(msg.y - wid.y)
        msg.app = wid.appid
        msg.target = wid.appid
        // app.log("sending",msg,'to widget',wid)
        app.ws.send(JSON.stringify(msg))
    }
    app.on(INPUT.TYPE_MouseDown, m => {
        Object.values(widgets).forEach(wid =>  {
            if(wid.y <= m.payload.y && wid.y+wid.h > m.payload.y) {
                forward_to_widget(m,wid)
            }
        })
    })

    async function start_widget(opts) {
        let resp = await app.send_and_wait_for_response({
            type:"START_SUB_APP",
            entrypoint:opts.entrypoint
        })
        widgets[resp.appid] = {
            appid:resp.appid,
            windows:[],
            x:opts.x,y:opts.y,h:opts.h,w:opts.w,
        }
    }

    await start_widget({entrypoint:"src/clients/sidebar/clock.js", x:1, y:0,w:80,h:22})
    await start_widget({entrypoint:"src/clients/sidebar/weather.js", x:1, y:23,w:80,h:39-23})
    await start_widget({entrypoint:"src/clients/sidebar/cpuinfo.js", x:1, y:39,w:80,h:55-39})
    await start_widget({entrypoint:"src/clients/sidebar/music.js", x:1, y:55,w:80,h:82-55})

    app.on("SUB_APP_WINDOW_OPEN",(msg)=>{
        let m = msg.payload
        widgets[m.app].windows.push(m.window)
    })
    app.on(WINDOWS.TYPE_window_refresh_request,()=>{
        Object.entries(widgets).forEach(([appid,info])=>{
            info.windows.forEach(win => {
                app.send(WINDOWS.MAKE_window_refresh_request({
                    target:appid,
                    window:win,
                }))
            })
        })
    })
}
app.on('start',()=>init())

