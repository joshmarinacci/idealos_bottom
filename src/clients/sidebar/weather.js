import {App, Component, Container} from '../toolkit/guitoolkit.js'

class WeatherPanel extends Container {
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


let app = new App(process.argv)

async function init() {
    await app.a_init()
    let win = await app.open_window(0,0,80,15,'plain')
    win.root = new WeatherPanel({ width:80, height:15, })
    win.repaint()
    console.log("initted weather app")
}
app.on('start',()=>init())

