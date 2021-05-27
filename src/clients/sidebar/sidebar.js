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
        this.height = 30
    }
    redraw(gfx) {
        let bg = 'red'
        this.data.forEach((v,i)=>{
            gfx.rect(i*2, 0, 1, Math.floor(v*30), bg)
        })
        // super.redraw(gfx)
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
            // new TimeDatePanel(),
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

