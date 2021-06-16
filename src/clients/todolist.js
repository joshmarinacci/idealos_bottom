import {CONSTRAINTS, HBox, VBox} from './toolkit/panels.js'
import {App} from './toolkit/guitoolkit.js'
import {Label, MultilineTextBox} from './toolkit/text.js'
import {Button, CheckButton, ToggleButton} from './toolkit/buttons.js'

let app = new App(process.argv)

async function init() {
    await app.a_init()
    let win = await app.open_window(0, 0, 100,100, 'plain')

    let items = [
        {
            title:"item 1",
            completed:false,
        },
        {
            title:'item 2',
            completed: true
        },
        {
            title:'item 3',
            completed: false,
        }
    ]

    let item_comps = items.map(it => {
        let tb = new CheckButton({
            selected:it.completed,
            action:() => it.completed = tb.selected,
        })
        return new HBox({
            children:[ tb,  new Label({text:it.title}) ]
        })
    })

    win.root = new VBox({
        constraint:CONSTRAINTS.FILL,
        children:item_comps,
    })
}


app.on('start',()=>init())
