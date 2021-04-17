import {make_message, SCHEMAS} from '../canvas/messages.js'
import {CommonApp, PixelFont} from './app_utils.js'
import {Button, Label, Panel, TextBox} from './guitoolkit.js'
let app = new CommonApp(process.argv,100,100)

async function init() {
    try {
        //load font
        app.font = await PixelFont.load("src/clients/fonts/font.png", "src/clients/fonts/font.metrics.json")

        //create gui components
        app.win.root = new Panel({
            width:app.win.width,
            height:app.win.height,
            children:[
                new Label({text:"label",x:0, width:20}),
                new Button({text:'button',x:0, y:15, width:30, height:15, id:'button'}),
                new Label({text:'label',x:50, y:15, id:'button-target'}),
                new TextBox({text:"hi",y:50, width:60, height: 15}),
            ]})
        //attach actions
        app.win.root.find({id:'button'}).on('action',()=>{
            app.win.root.find({id:'button-target'}).text = 'clicked!'
            app.win.redraw()
        })
        //redraw
        app.win.redraw()
        //get the latest version of the theme
        app.send(make_message(SCHEMAS.RESOURCE.GET,{'resource':'theme','sender':app.appid}))
    } catch (e) {
        app.log(e)
    }
}




app.on('start',()=>init())