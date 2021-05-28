import {App, Component, Container} from '../toolkit/guitoolkit.js'

class TimeDatePanel extends Container {
    constructor(opts) {
        super(opts);
    }

    redraw(gfx) {
        let ts = new Date()
        // time pm date
        gfx.rect(this.x,this.y,this.width,this.height,'white')
        gfx.text(this.x+2, this.y+0, ts.toLocaleTimeString(), 'black')
        gfx.text(this.x+2, this.y+9, ts.toLocaleDateString(), 'black')
    }
}

let app = new App(process.argv)

async function init() {
    await app.a_init()
    let win = await app.open_window(0,0,80,22,'plain')
    win.root = new TimeDatePanel({ width:80, height:22, })
    win.repaint()
    setInterval(()=>{
        win.repaint()
    },60*1000)
    console.log("initted clock app")
}
app.on('start',()=>init())

