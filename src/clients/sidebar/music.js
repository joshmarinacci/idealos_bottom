import {App, Component, Container} from '../toolkit/guitoolkit.js'

const MUSIC_NOTE_ICON = String.fromCodePoint(13)
const PLAY_ICON = String.fromCodePoint(25)
const PAUSE_ICON = String.fromCodePoint(26)

let app = new App(process.argv)

class MusicPlayerPanel extends Component {
    constructor(opts) {
        super(opts);
        this.playing = false
    }
    input(e) {
        this.playing = !this.playing
        if(this.playing) {
            app.send({
                type: "audio-server-play",
                url: "url.mp3"
            })
        } else {
            app.send({
                type: "audio-server-pause",
                url: "url.mp3"
            })
        }
        this.repaint(e)
    }

    redraw(gfx) {
        gfx.rect(this.x,this.y,this.width,this.height,'white')
        gfx.rect(this.x+1,this.y+0,5,this.height-1,'white')
        gfx.rect(this.x+2,this.y+1,3,10,'black')

        if(this.playing) {
            gfx.text(this.x + 10, this.y + 1, PAUSE_ICON, 'black')
        } else {
            gfx.text(this.x + 10, this.y + 1, PLAY_ICON, 'black')
        }
        gfx.text(this.x+20,this.y+1,'Hey Jude','white')
        gfx.text(this.x+10,this.y+15,'Past Masters - The Beatles','white')
        gfx.text(this.x+65,this.y+1,MUSIC_NOTE_ICON,'black')
    }
}


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

