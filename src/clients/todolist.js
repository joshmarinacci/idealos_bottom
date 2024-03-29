import {CONSTRAINTS, HBox, VBox} from './toolkit/panels.js'
import {App, Container} from './toolkit/guitoolkit.js'
import {Label, TextBox} from './toolkit/text.js'
import {Button, CheckButton} from './toolkit/buttons.js'
import {CATEGORIES} from '../server/db/schema.js'
import {WINDOWS} from 'idealos_schemas/js/windows.js'

let app = new App(process.argv)

async function init() {
    await app.a_init()
    let win = await app.open_window(50, 50, 200,100, 'plain')

    let add = new HBox({
        children:[
        new TextBox({text:"new item", width:120, height:16, id:'input'}),
        new Button({text:"add", height:12, action:()=>{
            let txt = win.root.find({id:"input"}).text
            win.send({
                type:"database-add",
                object:{
                    category:CATEGORIES.TASKS.ID,
                    type:CATEGORIES.TASKS.TYPES.TASK,
                    props:{
                        "title":txt,
                        "completed":false,
                        "archived":false,
                        "deleted":false
                    }
                }
            })
        }})
    ]})
    let list = new ListPanel({
        category: CATEGORIES.TASKS.ID,
        query:{
            and: [
                {
                    TYPE: CATEGORIES.TASKS.TYPES.TASK
                },
                {
                    CATEGORY: CATEGORIES.TASKS.ID
                }
            ]
        },
        template_function:(task)=>{
            return new HBox({
                children:[
                    new CheckButton({
                        selected:task.props.completed,
                        action:() => {
                            win.send({
                                type:"database-update",
                                object:{
                                    id:task.id,
                                    props:{"completed":!task.props.completed}
                                }
                            })
                        }
                    }),
                    new Label({text:task.props.title})
                ]
            })
        }
    })
    win.root = new VBox({
        children:[
            add,
            list
        ],
    })
    win.redraw()
}


app.on('start',()=>init())
app.on(WINDOWS.TYPE_window_close_request,(e) => {
    app.a_shutdown().then(()=>console.log("finished"))
})


class ListPanel extends Container {
    constructor(opts) {
        super(opts);
        this.name = 'list-panel'
        this.list = null
        this.debug_draw_event = opts.debug_draw_event
        this.template_function = opts.template_function
        this.children = []
        this.query = opts.query
        this.category = opts.category
        this.lineheight = 15
    }
    measure(gfx) {
        this.children.forEach(ch => {
            ch.calculated_height = 10
            ch.calculated_width = 10
            ch.width = 10
            ch.height = 10
        })
        this.children.forEach(ch => ch.measure(gfx))

        if(!this.list) {
            this.list = []
            this.window().app.on("database-query-response",(t) => {
                console.log("got the database response",t.payload.docs.length)
                this.list = t.payload.docs
                if(!this.template_function) throw new Error("ListPanel missing template_function")
                this.children = this.list.map(this.template_function)
                this.children.forEach(ch => ch.parent = this)
                this.repaint(t)
                // if(this.debug_draw_event) this.window().send({
                //     type:"debug-action-done",
                //     count:t.payload.docs.length
                // })
            })
            this.window().app.on("database-watch-update",t => {
                // console.log("got database update",t)
                this.window().send({
                    type:"database-query",
                    query: this.query
                })
            })
            this.window().send({
                type:"database-query",
                query: this.query
            })
            this.window().send({
                type:"database-watch",
                category:this.category
            })
        } else {
            // this.preferred_width = this.parent.width
            // this.width = this.parent.width
            this.preferred_width = 100
            this.preferred_height = this.list.length*this.lineheight
            this.calculated_width = this.preferred_width
            this.calculated_height = this.preferred_height
            this.children.forEach(ch => ch.layout(gfx))
            this.children.forEach((ch,i) => {
                // ch.x = 0
                ch.y = i*this.lineheight
                ch.height = this.lineheight
            })
        }
    }
    // redraw(gfx) {
    //     gfx.rect(0,0,this.width,this.height,'cyan')
    //     super.redraw(gfx)
    // }
}
