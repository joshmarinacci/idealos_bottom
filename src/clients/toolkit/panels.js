import {Component, Container} from './guitoolkit.js'
import {Button, ToggleButton} from './buttons.js'

export class Panel extends Container {
    constructor(opts) {
        super(opts)
        this.name = 'panel'
    }

    redraw(gfx) {
        gfx.rect(this.x, this.y, this.width, this.height, gfx.theme_bg_color('panel', 'white'))
        this.children.forEach(ch => ch.redraw(gfx))
    }
}

export const CONSTRAINTS = {
    FILL:'fill',
    WRAP:'wrap'
}
export class VBox extends Container {
    constructor(opts) {
        super(opts);
        this.border_width = opts.border_width || 0
        this.padding = opts.padding || 0
        this.hstretch = opts.hstretch || false
        this.name = 'panel'
        this.fill_color = opts.fill_color
        this.constraint = opts.constraint || CONSTRAINTS.WRAP
    }
    layout(gfx) {
        if(this.constraint === CONSTRAINTS.WRAP) {
            this.children.forEach(ch => ch.layout(gfx))
            let y = this.padding
            let maxx = this.padding
            this.children.forEach(ch => {
                ch.x = this.padding
                ch.y = y
                y += ch.height
                y += this.padding
                maxx = Math.max(maxx, this.padding + ch.width + this.padding)
            })
            if (this.hstretch) {
                this.children.forEach(ch => ch.width = maxx)
            }
            this.width = maxx
            this.height = y
        }
        if(this.constraint === CONSTRAINTS.FILL) {
            this.width = this.parent.width
            this.height = this.parent.height
            this.children.forEach(ch => ch.layout(gfx))
            let y = this.padding
            let min_space = 0
            this.children.forEach(ch => min_space += ch.height)
            let extra_space = this.height - min_space
            this.children.forEach(ch => {
                ch.x = this.padding
                ch.y = y
                if(ch.flex === 1.0) {
                    ch.height = ch.height+extra_space
                }
                y += ch.height
                y += this.padding
            })
            let maxx = this.width - this.padding
            if(this.hstretch) {
                this.children.forEach(ch => {
                    ch.width = maxx
                    ch.layout(gfx)
                })
            }
        }
    }
    redraw(gfx) {
        if(this.fill_color) {
            gfx.rect(this.x,this.y,this.width,this.height,this.fill_color)
        } else {
            let bg = this.lookup_theme_part("background-color")
            gfx.rect(this.x, this.y, this.width, this.height, bg)
        }
        super.redraw(gfx)
    }
}

export class HBox extends Container {
    constructor(opts) {
        super(opts);
        this.padding = opts.padding || 0
        this.name = 'panel'
        this.vstretch = opts.vstretch || false
        this.fill_color = opts.fill_color
    }
    layout(gfx) {
        this.children.forEach(ch => ch.layout(gfx))
        let x = this.padding
        let maxy = this.padding
        let min_space = 0
        this.children.forEach(ch => min_space += ch.width)
        let extra_space = this.width - min_space
        this.children.forEach(ch => {
            if(!ch.visible) return
            ch.x = x
            ch.y = this.padding
            if(ch.flex === 1.0) {
                ch.width = ch.width +extra_space
            }
            x += ch.width
            x += this.padding
            maxy = Math.max(maxy,this.padding+ch.height+this.padding)
        })
        if(this.vstretch) {
            this.children.forEach(ch => {
                ch.height = this.height
                ch.layout(gfx)
            })
        }
        this.width = x
        this.height = maxy
    }
    redraw(gfx) {
        if(this.fill_color) {
            gfx.rect(this.x,this.y,this.width,this.height,this.fill_color)
        } else {
            let bg = this.lookup_theme_part("background-color")
            gfx.rect(this.x, this.y, this.width, this.height, bg)
        }
        super.redraw(gfx)
    }

}

export class StackPanel extends Container {
    constructor(opts) {
        super(opts);
        this.name = 'stack-panel'
    }
    layout(gfx) {
//        this.width = this.parent.width
//        this.height = this.parent.height
        this.children.forEach(ch => ch.layout(gfx))
        this.children.forEach(ch => {
            if(!ch.visible) return
            ch.x = 0
            ch.y = 0
            ch.width = this.width
            ch.height = this.height
        })
    }
}

export class TabPanel extends Container {
    constructor(opts) {
        super(opts);
        this.selected_index = 0
        this.tab_buttons = opts.tab_labels.map((t,i) => new ToggleButton({
            text:t,
            selected:(i===this.selected_index),
            action:()=> this.select_tab(i)
        }))
        this.tab_children = opts.tab_children.slice()
        this.children = [
            ... this.tab_buttons,
            ... this.tab_children,
        ]
        this.children.forEach(ch => ch.parent = this)
    }
    layout(gfx) {
        this.width = this.parent.width
        this.height = this.parent.height
        this.children.forEach(ch => ch.layout(gfx))
        let mx = 0
        let mh = 0
        this.tab_buttons.forEach(bt => {
            bt.x = mx
            mx = Math.max(bt.x+bt.width,mx)
            bt.y = 0
            mh = Math.max(bt.height,mh)
        })
        this.tab_children.forEach((comp,i) => {
            comp.visible = (i===this.selected_index)
            comp.x = 0
            comp.y = mh
            comp.width = this.width
            comp.height = this.height - mh
        })
    }
    redraw(gfx) {
        gfx.rect(this.x,this.y,this.width,this.height,'white')
        super.redraw(gfx)
    }
    select_tab(n) {
        this.selected_index = n
        this.tab_buttons.forEach((btn,i)=> btn.selected = (i===this.selected_index))
        this.repaint()
    }
}

const LEFT_TRIANGLE = String.fromCodePoint(23);
const RIGHT_TRIANGLE = String.fromCodePoint(22);
const UP_TRIANGLE = String.fromCodePoint(24);
const DOWN_TRIANGLE = String.fromCodePoint(16);
class HScrollBar extends Container {
    constructor(model) {
        super()
        this.model = model
        this.left_arrow  = new Button({
            text:LEFT_TRIANGLE,
            action:()=>this.scroll_left()})
        this.right_arrow = new Button({
            text:RIGHT_TRIANGLE,
            action:()=>this.scroll_right()})
        this.children = [this.left_arrow,this.right_arrow]
        this.children.forEach(ch => ch.parent = this)
    }
    layout(gfx) {
        super.layout(gfx)

        let s = this.height
        this.left_arrow.x = 0
        this.left_arrow.width = s
        this.left_arrow.height = s
        this.left_arrow.y = 0

        this.right_arrow.width = s
        this.right_arrow.height = s
        this.right_arrow.x = this.width-s
        this.right_arrow.y = 0
    }
    redraw(gfx) {
        gfx.rect(this.x,this.y,this.width,this.height,'black')
        gfx.rect(this.x+1,this.y+1,this.width-2,this.height-2,'white')
        let w = this.width-this.left_arrow.width - this.right_arrow.width
        let x = this.x + this.left_arrow.width
        let wx = w - this.model.offsetx
        gfx.rect(x + wx-10,this.y+2, 1, this.height-4,'black')
        super.redraw(gfx)
    }

    scroll_left() {
        this.model.scroll_left()
    }
    scroll_right() {
        this.model.scroll_right()
    }
}

class VScrollBar extends Container {
    constructor(model) {
        super()
        this.model = model
        this.start_arrow  = new Button({
            text:UP_TRIANGLE,
            action:()=>this.scroll_up()})
        this.end_arrow = new Button({
            text:DOWN_TRIANGLE,
            action:()=>this.scroll_down()})
        this.children = [this.start_arrow,this.end_arrow]
        this.children.forEach(ch => ch.parent = this)
    }
    layout(gfx) {
        super.layout(gfx)

        let s = this.width
        this.start_arrow.x = 0
        this.start_arrow.y = 0
        this.start_arrow.width = s
        this.start_arrow.height = s

        this.end_arrow.x = 0
        this.end_arrow.y = this.height-s
        this.end_arrow.width = s
        this.end_arrow.height = s
    }
    redraw(gfx) {
        gfx.rect(this.x,this.y,this.width,this.height,'black')
        gfx.rect(this.x+1,this.y+1,this.width-2,this.height-2,'white')
        let gutter_length = this.height -
            this.start_arrow.height -
            this.end_arrow.height
        let start = this.y + this.start_arrow.height
        let scale = this.model.view_height()/this.model.content_height()
        let fract = this.model.offsety / this.model.content_height()
        let pos = - gutter_length*fract
        // let bar = scale * this.model.view_height()
        let bar = 1
        gfx.rect(this.x+2,
            Math.floor(start + pos),
            this.width-4,
            Math.round(bar),
            'black')
        super.redraw(gfx)
    }

    scroll_down() {
        this.model.scroll_down()
    }
    scroll_up() {
        this.model.scroll_up()
    }
}

export class ScrollPanel extends Container {
    constructor(opts) {
        super(opts);
        this.sw = 15
        this.step = 10
        this.vslider = new VScrollBar(this)
        this.vslider.width = this.sw
        this.hslider = new HScrollBar(this)
        this.hslider.height = this.sw
        this.controls = [this.hslider,this.vslider]
        this.content = opts.children
        this.children = [
            ...this.controls,
            ...this.content,
        ]
        this.children.forEach(ch => ch.parent = this)
        this.offsetx = 0
        this.offsety = 0
        this.hstretch = opts.hstretch || false
    }
    scroll_up() {
        this.offsety += this.step
        if(this.offsety > 0) this.offsety = 0
        this.repaint()
    }
    scroll_down() {
        this.offsety -= this.step
        let m = this.view_height() -this.offsety
        if(m > this.content_height()) {
            this.offsety = -(this.content_height()-this.view_height())
        }
        this.repaint()
    }
    content_height() {
        return this.content[0].height
    }
    content_width() {
        return this.content[0].width
    }
    view_height() {
        return this.height - this.sw
    }
    view_width() {
        return this.width - this.sw
    }
    scroll_right() {
        this.offsetx -= this.step
        let m = this.view_width() - this.offsetx
        if(m > this.content_width()) {
            this.offsetx = (this.content_width() - this.view_width())
        }
        this.repaint()
    }
    scroll_left() {
        this.offsetx += this.step
        if(this.offsetx > 0) this.offsetx = 0
        this.repaint()
    }
    layout(gfx) {
        if(this.hstretch) {
            this.content.forEach(ch => ch.width = this.width - this.sw)
        }
        super.layout(gfx)
        this.hslider.x = 0
        this.hslider.y = this.height - this.sw
        this.hslider.width = this.width - this.sw
        this.hslider.height = this.sw

        this.vslider.x = this.width - this.sw
        this.vslider.y = 0
        this.vslider.width = this.sw
        this.vslider.height = this.height-this.sw

        this.content.forEach(ch => {
            ch.x = this.offsetx
            ch.y = this.offsety
        })
    }
    redraw(gfx) {
        let b = 2
        // border
        gfx.rect(this.x, this.y, this.width-this.sw, this.height-this.sw, 'black')
        // background
        let ww = this.width -b * 2 - this.sw
        let hh = this.height -b *2 - this.sw
        gfx.rect(this.x + b, this.y + b, ww, hh, 'white')
        //draw content
        gfx.translate(this.x, this.y)
        gfx.set_clip_rect(b,b,ww, hh)
        this.content.forEach(ch => ch.redraw(gfx))
        gfx.clear_clip_rect()
        gfx.translate(-this.x, -this.y)
        //draw buttons
        gfx.translate(this.x, this.y)
        this.controls.forEach(ch => ch.redraw(gfx))
        gfx.translate(-this.x, -this.y)
    }
}

export class GridDebugPanel extends Component {
    redraw(gfx) {
        let s = 5
        let colors = ['cyan','blue','red','green']
        for(let i=0; i<colors.length; i++) {
        // for(let i=0; i<1; i++) {
            gfx.rect(this.x+i*s, this.y+i*s, this.width-i*s*2, this.height-i*s*2, colors[i])
        }
    }
}

export class ListView extends Container {
    constructor(opts) {
        super(opts);
        this.name = 'list-view'
        this.data = opts.data
        this.template_function = opts.template_function
        this.children = []
        this.generated = false
        this.selected_index = 0
    }
    layout(gfx) {
        if(!this.generated) {
            this.children = this.data.map((item,i) => {
                let ch = this.template_function(item)
                let li = new ListItem({children:[ch], padding:2})
                li.fill_color = 'transparent'
                li.parent = this
                li.list_view = this
                li.action = ()=>this.set_selected(i)
                return li
            })
            this.generated = true
        }
        let lh = 21
        this.height = this.children.length*lh
        super.layout(gfx)
        this.children.forEach((ch,i) => {
            ch.x = 0
            ch.y = i*lh
            ch.height = lh-1
            ch.width = this.width
        })
    }
    redraw(gfx) {
        let bg = this.lookup_theme_part("background-color",null)
        gfx.rect(this.x,this.y,this.width,this.height,bg)
        gfx.translate(this.x,this.y)
        this.children.forEach((ch,i) => {
            if(this.selected_index === i) {
                ch.selected = true
            } else {
                ch.selected = false
            }
            ch.redraw(gfx)
        })
        gfx.translate(-this.x,-this.y)
    }
    set_selected(index,e) {
        this.selected_index = index
        this.repaint(e)
        this.fire('changed',this)
    }

    set_data(docs) {
        this.data = docs
        this.selected_index = -1
        this.generated = false
        this.children = []
        this.fire('changed',this)
        this.repaint()
    }
}

class ListItem extends HBox {
    constructor(opts) {
        super(opts);
        this.name = "list-item"
        this.selected = false
    }
    input(e) {
        this.action(e)
        return true
    }
    redraw(gfx) {
        let bg = this.lookup_theme_part("background-color",this.selected?"selected":null)
        gfx.rect(this.x,this.y,this.width,this.height,bg)
        super.redraw(gfx)
    }
}
