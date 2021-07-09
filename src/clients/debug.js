import {App} from './toolkit/guitoolkit.js'
import {CONSTRAINTS, VBox} from './toolkit/panels.js'
import {Button} from './toolkit/buttons.js'
import {TranslatedLabel} from './toolkit/text.js'
import {WINDOWS} from 'idealos_schemas/js/windows.js'

let app = new App(process.argv)
let wind = null
let theme = 'light'
let language = 'base'
async function init() {
    await app.a_init()
    let win = await app.open_window(0,0,100,50, 'debug')
    win.root = new VBox({
        id:'vbox',
        constraint:CONSTRAINTS.FILL,
        children: [
            new Button({text:'toggle theme',action:()=>{
                console.log("clicked")
                    if(theme === 'light') win.send({type:"theme-set",name:"dark"})
                    if(theme === 'dark') win.send({type:"theme-set",name:"light"})
            }}),
            new Button( {text:'toggle language', action:() => {
                    if(language === 'base') win.send({type:'translation_set_language',language:"lolcat"})
                    if(language === 'lolcat') win.send({type:'translation_set_language',language:"base"})
            }}),
            new TranslatedLabel({text_key:"button.okay"})
        ]
    })
    win.redraw()
}

app.on('start',()=>init())
app.on("theme-changed",(msg)=>{
    theme = msg.payload.name
})
app.on("translation_language_changed",msg => {
    language = msg.payload.language
})
app.on(WINDOWS.TYPE_window_close_request,(e) => {
    app.a_shutdown().then(()=>console.log("finished"))
})
