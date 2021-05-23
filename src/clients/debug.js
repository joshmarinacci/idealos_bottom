import {App, Component} from './toolkit/guitoolkit.js'
import {DEBUG} from 'idealos_schemas/js/debug.js'
import {INPUT} from 'idealos_schemas/js/input.js'
import {VBox} from './toolkit/panels.js'
import {Button} from './toolkit/buttons.js'

let app = new App(process.argv)
let wind = null
let theme = 'light'
async function init() {
    await app.a_init()
    let win = await app.open_window(0,0,100,50, 'debug')
    win.root = new VBox({
        id:'vbox',
        children: [
            new Button({text:'toggle theme',action:()=>{
                console.log("clicked")
                    if(theme === 'light') win.send({type:"theme-set",name:"dark"})
                    if(theme === 'dark') win.send({type:"theme-set",name:"light"})
            }}),
        ]
    })
}

app.on('start',()=>init())
app.on("theme-changed",(msg)=>{
    console.log('the theme has changed',msg)
    theme = msg.payload.name
})
