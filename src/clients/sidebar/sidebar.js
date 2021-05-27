/*
* time and date
* muisc player
* cpu info
* weather
* notifications
 */


import {App} from '../toolkit/guitoolkit.js'
import {VBox} from '../toolkit/panels.js'
import {Container} from '../toolkit/guitoolkit.js'


let app = new App(process.argv)

class TimeDatePanel extends Container {
    constructor(opts) {
        super(opts);
    }

    redraw(gfx) {
        super.redraw(gfx)
        let ts = new Date()
        // time pm date
        gfx.rect(this.x, this.y, this.width, this.height,'black')
        gfx.rect(this.x+1, this.y+1, this.width-2, this.height-2,'white')
        gfx.text(this.x+1, this.y+1, ts.toDateString(), 'black')
        gfx.text(this.x+1, this.y+10, ts.toDateString(), 'black')
    }
}

class MusicPlayerPanel extends Container {

}

class CPUInfoPanel extends Container {
    constructor(opts) {
        super(opts);
        this.data = []
        setInterval(()=> this.updateTick(),1000)
    }
    layout(gfx) {
        this.width = 80
        this.height = 20
    }
    redraw(gfx) {
        super.redraw(gfx)
        let bg = 'black'
        this.data.forEach((v,i)=>{
            let vv = Math.floor(v*this.height)
            gfx.rect(this.x+i*2, this.y+this.height-vv, 1, vv, bg)
        })
    }

    updateTick() {
        this.data.push(Math.random())
        if(this.data.length > 40) this.data.shift()
        this.repaint()
    }
}

class WeatherPanel extends Container {

}

class NotificationsPanel extends Container {

}

async function init() {
    await app.a_init()
    let win = await app.open_window(50,50,100,200,'plain')
    win.root = new VBox({width:100, height:300, children:[
            new TimeDatePanel({
                width:80,
                height:20,
            }),
            // new MusicPlayerPanel(),
            new CPUInfoPanel({
                width:80,
                height:20,
            }),
            // new WeatherPanel(),
            // new NotificationsPanel(),
        ]})
}
app.on('start',()=>init())

