import {App, Component, Container} from '../toolkit/guitoolkit.js'

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

let app = new App(process.argv)

async function init() {
    await app.a_init()
    let win = await app.open_window(0,0,80,15,'plain')
    win.root = new MusicPlayerPanel({
        width:80,
        height:30,
    })
    win.repaint()
    console.log("initted music app")
}
app.on('start',()=>init())

