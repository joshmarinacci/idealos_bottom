import {make_message, SCHEMAS} from '../canvas/messages.js'
import {CommonApp, PixelFont} from './app_utils.js'
import {Button, HBox, Label, Panel, TextBox, ToggleButton, VBox} from './guitoolkit.js'
let app = new CommonApp(process.argv,100,100)

async function init() {
    try {
        //load font
        app.font = await PixelFont.load("src/clients/fonts/font.png", "src/clients/fonts/font.metrics.json")

        //create gui components
        app.win.root = new VBox({
            width:app.win.width,
            height:app.win.height,
            children:[
                new Label({text:"label 1"}),
                // new Label({text:"label 2"}),
                // new Label({text:"label 3"}),
                new Button({text:'button',width:30, height:15}),
                new HBox({children:[
                    new Button({text:'button',width:30, height:15, id:'button'}),
                    new Label({text:'label',id:'button-target'}),
                ]}),
                // new TextBox({text:"hi",width:50, height: 15, id:'textbox'}),
                // new HBox({children:[
                //     new ToggleButton({text:'A', width:15, height:15}),
                //     new ToggleButton({text:'B', width:15, height:15}),
                // ]})
            ]})
        //attach actions
        // app.win.root.find({id:'button'}).on('action',()=>{
        //     app.win.root.find({id:'button-target'}).text = 'clicked!'
        //     app.win.redraw()
        // })
        // app.win.root.find({id:'textbox'}).on('action',()=>{
        //     app.win.root.find({id:'button-target'}).text = 'committed'
        //     app.win.redraw()
        // })
        //redraw
        app.win.redraw()
        //get the latest version of the theme
        app.send(make_message(SCHEMAS.RESOURCE.GET,{'resource':'theme','sender':app.appid}))
    } catch (e) {
        app.log(e)
    }
}




app.on('start',()=>init())