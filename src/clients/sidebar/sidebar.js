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

class TimeDatePanel extends Container {
    constructor(opts) {
        super(opts);
    }

    redraw(gfx) {
        super.redraw(gfx)
        let ts = new Date()
        // time pm date
        gfx.rect(this.x,this.y,this.width,this.height,'black')
        gfx.rect(this.x+1,this.y+1,this.width-2,this.height-2,'white')
        gfx.text(this.x+2, this.y+0, ts.toLocaleTimeString(), 'black')
        gfx.text(this.x+2, this.y+9, ts.toLocaleDateString(), 'black')
    }
}

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

class CPUInfoPanel extends Container {
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
        super.redraw(gfx)
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

class WeatherPanel extends Component {
    constructor(opts) {
        super(opts);
    }
    redraw(gfx) {
        //fill white
        gfx.rect(this.x,this.y,this.width,this.height,'black')
        gfx.rect(this.x+1,this.y,this.width-2,this.height-1,'white')
        //draw icon
        gfx.rect(this.x+2,this.y+2,10,10,'black')
        //show temp
        gfx.text(this.x+20, this.y, '45o','black')
    }
}

class NotificationsPanel extends Container {

}

async function init() {
    await app.a_init()
    await app.send({
        type:"SIDEBAR_START",
    })
    let win = await app.open_window(50,50,80,200,'sidebar')
    win.root = new VBox({width:80, height:300, children:[
            new TimeDatePanel({
                width:80,
                height:22,
            }),
            new MusicPlayerPanel({
                width:80,
                height:30,
            }),
            new CPUInfoPanel({
                width:80,
                height:15,
            }),
            new WeatherPanel({
                width:80,
                height:15,
            }),
            // new NotificationsPanel(),
        ]})
}
app.on('start',()=>init())

