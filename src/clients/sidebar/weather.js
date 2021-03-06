import {App, Component, Container} from '../toolkit/guitoolkit.js'
const WEATHER_ICONS = {
    SUNNY:String.fromCodePoint(3),
    RAIN:String.fromCodePoint(4)
}
class WeatherPanel extends Container {
    constructor(opts) {
        super(opts);
    }
    redraw(gfx) {
        //fill white
        gfx.rect(this.x,this.y,this.width,this.height,'white')
        //draw icon
        // gfx.rect(this.x+2,this.y+2,10,10,'black')
        gfx.text(this.x+2, this.y+2,WEATHER_ICONS.RAIN,'black')
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

