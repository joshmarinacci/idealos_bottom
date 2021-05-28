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

let app = new App(process.argv)


class MusicPlayerPanel extends Component {
    constructor(opts) {
        super(opts);
    }
    redraw(gfx) {
        gfx.rect(this.x,this.y,this.width,this.height,'black')
        gfx.rect(this.x+1,this.y+0,5,this.height-1,'white')
        gfx.rect(this.x+2,this.y+1,3,10,'black')

        gfx.text(this.x+10,this.y+1,'Hey Jude','white')
        gfx.text(this.x+10,this.y+15,'Past Masters - The Beatles','white')
    }
}

class CPUInfoPanel extends Component {
    constructor(opts) {
        super(opts);
        this.data = []
        setInterval(()=> this.updateTick(),1000)
    }
    layout(gfx) {
        this.width = 80
        this.height = 15
    }
    redraw(gfx) {
        gfx.rect(this.x,this.y,this.width,this.height,'black')
        gfx.rect(this.x+1,this.y,this.width-2,this.height-1,'white')
        let bg = 'black'
        this.data.forEach((v,i)=>{
            let vv = Math.floor(v*(this.height-2))
            gfx.rect(this.x+i*2, this.y+this.height-vv-2, 1, vv, bg)
        })
    }

    updateTick() {
        this.data.push(Math.random())
        if(this.data.length > 40) this.data.shift()
        this.repaint()
    }
}

class NotificationsPanel extends Component {
}

async function init() {
    await app.a_init()
    await app.send({
        type:"SIDEBAR_START",
    })
    let win = await app.open_window(50,50,80,200,'sidebar')
    win.root = new VBox({width:80, height:300, children:[
            // new MusicPlayerPanel({
            //     width:80,
            //     height:30,
            // }),
            // new CPUInfoPanel({
            //     width:80,
            //     height:15,
            // }),
            // new NotificationsPanel(),
        ]})

    let y = 0
    let widgets = {}
    app.on("START_SUB_APP_RESPONSE",(msg)=>{
        console.log("response",msg.payload)
        widgets[msg.payload.appid] = y
        y+= 30
    })

    app.on('MAKE_DrawRect_name',(msg)=>{
        console.log("forwarded rect",msg.payload.app)
        let m = msg.payload
        let offset = widgets[m.app]
        console.log(offset)
        app.send({
            type:m.type,
            window:win._winid,
            color:m.color,
            x:m.x,
            y:m.y+offset,
            width:m.width,
            height:m.height,
        })
    })
    app.on('MAKE_DrawImage_name',(msg)=>{
        console.log("forwarded image",msg.payload)
        let m = msg.payload
        let offset = widgets[m.app]
        console.log(offset)
        app.send({
            type:m.type,
            window:win._winid,
            color:m.color,
            x:m.x,
            y:m.y+offset,
            width:m.width,
            height:m.height,
            pixels:m.pixels,
        })
    })

    await app.send({
        type:"START_SUB_APP",
        entrypoint:"src/clients/sidebar/weather.js"
    })
    await app.send({
        type:"START_SUB_APP",
        entrypoint:"src/clients/sidebar/clock.js"
    })
}
app.on('start',()=>init())

