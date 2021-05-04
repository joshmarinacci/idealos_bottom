import {App, Component, Label, VBox} from './guitoolkit.js'
import {DEBUG} from 'idealos_schemas/js/debug.js'
import {INPUT} from 'idealos_schemas/js/input.js'

export class IconButton extends Component {
    constructor(opts) {
        super(opts)
        this.text = opts.text || "icon"
        this.appname = opts.appname
        this.pressed = false
    }

    layout(gfx) {
        let met = gfx.text_size(this.text,this.font)
        this.width = 16
        this.height = 16
    }

    input(evt) {
        if(evt.type === INPUT.TYPE_MouseDown) {
            app.send(DEBUG.MAKE_StartAppByName({ name:this.appname }))
            this.pressed = true
            this.repaint()
        }
        if(evt.type === INPUT.TYPE_MouseUp) {
            this.pressed = false
            this.repaint()
        }
        return true
    }

    redraw(gfx) {
        let bg = this.pressed?"red":"white"
        let fg = this.pressed?"white":"black"
        gfx.rect(this.x, this.y, this.width, this.height, bg)
        gfx.text(this.x+2, this.y, this.text, 'black',this.font)
    }
}

let app = new App(process.argv)
async function init() {
    await app.a_init()
    let win = await app.open_window(0, 0, 1+16+1, 16 * 5, 'dock')
    win.root = new VBox({
        width: 16,
        height: 16 * 5,
        padding:1,
        children: [
            new IconButton({text: "s",appname:'fractal', font:app._symbol_font}),
            new IconButton({text: "t",appname:'guitest', font:app._symbol_font}),
            new IconButton({text: "r",appname:'dotclock', font:app._symbol_font}),
        ]
    })
}

app.on('start',()=>init())
