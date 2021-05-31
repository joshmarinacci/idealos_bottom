import {App, Component} from './toolkit/guitoolkit.js'
import {DEBUG} from 'idealos_schemas/js/debug.js'
import {INPUT} from 'idealos_schemas/js/input.js'
import {VBox} from './toolkit/panels.js'

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
let wind = null
async function init() {
    await app.a_init()
    let win = await app.open_window(0, 0, 1+16+1, 16 * 5, 'dock')
    win.root = new VBox({
        width: 16,
        height: 16 * 5,
        padding:1,
        id:'vbox',
        children: [
            // new IconButton({text: "s",appname:'fractal', font:app._symbol_font}),
            // new IconButton({text: "t",appname:'guitest', font:app._symbol_font}),
            // new IconButton({text: "r",appname:'dotclock', font:app._symbol_font}),
        ]
    })
    wind = win
    app.send({ type:"LIST_ALL_APPS" })
}

app.on('start',()=>init())

function icon_for_app(name) {
    console.log("checking for icon for name",name)
    if(name === "debug") return String.fromCodePoint(12)
    if(name === "fractal") return String.fromCodePoint(2)
    if(name === "guitest") return String.fromCodePoint(11)
    if(name === "pixelclock") return String.fromCodePoint(10)
    return String.fromCodePoint(1)
}

app.on('LIST_ALL_APPS_RESPONSE',(msg)=>{
    // console.log("============ got the list of apps",msg.payload.apps.user, wind)
    wind.root.children = msg.payload.apps.user.map(app => {
        let icon = icon_for_app(app.name)
        return new IconButton({
            text:icon,
            appname:app.name,
            font:wind.app._symbol_font
        })
    })
    wind.redraw()
})
