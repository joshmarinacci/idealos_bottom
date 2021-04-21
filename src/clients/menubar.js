import {make_message, SCHEMAS} from '../canvas/messages.js'
import {CommonApp, PixelFont} from './app_utils.js'
import {Container} from './guitoolkit.js'
let app = new CommonApp(process.argv,1024/4,10,'menubar')


class CustomMenuBar extends Container {
    constructor(opts) {
        super(opts)
    }
    redraw(gfx) {
        gfx.rect(this.x,this.y,this.width,this.height,'white')
        gfx.text(this.x,this.y,'cool menu bar','black')
    }
}

async function init() {
    try {
        //load font
        app.font = await PixelFont.load("src/clients/fonts/font.png", "src/clients/fonts/font.metrics.json")

        //create gui components
        app.win.root = new CustomMenuBar({width:app.win.width, height:app.win.height})
        app.win.redraw()
        //get the latest version of the theme
        app.send(make_message(SCHEMAS.RESOURCE.GET,{'resource':'theme','sender':app.appid}))
    } catch (e) {
        app.log(e)
    }
}




app.on('start',()=>init())