import {App, Component, Label, VBox} from './guitoolkit.js'
import {DEBUG} from 'idealos_schemas/js/debug.js'

export class IconButton extends Component {
    constructor(opts) {
        super(opts)
        this.text = opts.text || "icon"
        this.appname = opts.appname
    }

    layout(gfx) {
        let met = gfx.text_size(this.text)
        this.width = 16
        this.height = 16
    }

    input(mouse, keyboard) {
        if(!mouse.inside(this.x,this.y,this.width,this.height)) return false
        if(mouse.down && !this.pressed) {
            console.log('down action')
            app.send(DEBUG.MAKE_StartAppByName({
                name:this.appname
            }))
        }
        this.pressed = mouse.down
        return true
    }

    redraw(gfx) {
        gfx.rect(this.x, this.y, this.width, this.height, 'white')
        gfx.text(this.x=2, this.y, this.text, 'black')
    }
}

let app = new App(process.argv)
async function init() {
    await app.a_init()
    app.log("done initting. opening window")
    let win = await app.open_window(0, 0, 16, 16 * 5, 'dock')
    win.root = new VBox({
        width: 16,
        height: 16 * 5,
        children: [
            new IconButton({text: "F",appname:'fractal'}),
            new IconButton({text: "G",appname:'guitest'}),
            new IconButton({text: "C",appname:'dotclock'}),
        ]
    })
}

app.on('start',()=>init())
