import {make_message, SCHEMAS} from '../canvas/messages.js'
import {CommonApp, PixelFont} from './app_utils.js'
import {Container} from './guitoolkit.js'
let app = new CommonApp(process.argv,1024/4,10,'menubar')

let menu_tree = {
    type:'root',
    children:[
        {
            type:'top',
            label:'File',
            children:[
                {
                    type:'item',
                    label:'Open',
                    event:'open_file',
                    keystroke:{
                        modifier:'meta',
                        key:'O',
                    }
                },
                {
                    type:'item',
                    label:'Close',
                    event:'close_window',
                    keystroke: {
                        modifier: 'meta',
                        key:'W',
                    }
                }
            ]
        },
        {
            type:'top',
            label:'Edit',
            children:[
                {
                    type:'item',
                    label:'Cut',
                    event:'clipboard_cut',
                    keystroke: {
                        modifier: 'meta',
                        key:'X'
                    }
                },
                {
                    type:'item',
                    label:'Copy',
                    event:'clipboard_copy',
                    keystroke: {
                        modifier: 'meta',
                        key:'C'
                    }
                },
                {
                    type:'item',
                    label:'Paste',
                    event:'clipboard_paste',
                    keystroke: {
                        modifier: 'meta',
                        key:'V'
                    }
                },
            ]
        }
    ]
}


/*
syntax def for menu tree

// base types
string
i32
// compound types
enum
array
object


node_type = enum string "item" "top" "root"
keystroke_obj = object modifier:string key:string
item = object type:node_type label:string event:string keystroke:keystroke_obj

generates schema JSON like this:
class ITEM_STRUCT {
   constructor(args) {
        if(!args.hasOwnProperty('type')) throw new Error(`'Item' missing property 'type'`)
        this.type = MAKE_NODE_TYPE_ENUM(args.type)
        if(!args.hasOwnProperty('label')) throw new Error(`'Item' missing property 'label')
        this.label = args.label
        if(!args.hasOwnProperty('keystroke')) throw new Error(`'Item' missing property 'keystroke')
        this.keystroke = MAKE_KEYSTROKE_STRUCT(args.keystroke)
   }
}
function MAKE_NODE_TYPE_ENUM(value) {
    if(value === "val1") return value
    if(value === "val2") return value
    throw new Error("enum node type: invalid value ${value" for enum "node_type))
}
let item = new Item_struct({type:'item', label:'Paste', event:'clipboard_paste', keystroke:{modifier:'meta',key:'V'})

item.to_json() => turns into JSON string for sending over the wire
 */


class CustomMenuBar extends Container {
    constructor(opts) {
        super(opts)
    }
    redraw(gfx) {
        gfx.rect(this.x,this.y,this.width,this.height,'white')
        gfx.text(this.x,this.y,'cool menu bar','black')
    }
}

async function init() {
    try {
        //load font
        app.font = await PixelFont.load("src/clients/fonts/font.png", "src/clients/fonts/font.metrics.json")

        //create gui components
        app.win.root = new CustomMenuBar({width:app.win.width, height:app.win.height})
        app.win.redraw()
        //get the latest version of the theme
        app.send(make_message(SCHEMAS.RESOURCE.GET,{'resource':'theme','sender':app.appid}))
    } catch (e) {
        app.log(e)
    }
}




app.on('start',()=>init())