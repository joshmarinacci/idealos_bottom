import {App, Component, Container} from '../toolkit/guitoolkit.js'

class CPUInfoPanel extends Component {
    constructor(opts) {
        super(opts);
        this.data = []
        setInterval(()=> this.updateTick(),3000)
    }
    layout(gfx) {
        this.width = 80
        this.height = 15
    }
    redraw(gfx) {
        gfx.rect(this.x,this.y,this.width,this.height,'white')
        let bg = 'black'
        this.data.forEach((v,i)=>{
            let vv = Math.floor(v*(this.height-3))
            gfx.rect(1+this.x+i*2, this.y+this.height-vv-2, 1, vv, bg)
        })
    }

    updateTick() {
        this.data.push(Math.random())
        if(this.data.length > 39) this.data.shift()
        this.repaint()
    }
}


let app = new App(process.argv)

async function init() {
    await app.a_init()
    let win = await app.open_window(0,0,80,15,'plain')
    win.root = new CPUInfoPanel({ width:80, height:15, })
    win.repaint()
    console.log("initted cpu info app")
}
app.on('start',()=>init())

