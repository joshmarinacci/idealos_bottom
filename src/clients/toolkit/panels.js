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
/*

a vbox can set constraint to fill to fill up the window parent
or add a property on the window to stretch the child to fill it?

window.grow-to-fit: makes the window size it's child to fill itself.
window.shrink-to-fit: makes the window adopt the size of it's child.
an enum for child_sizing?

boxes use direction for h vs v
boxes have no wrapping for now
boxes use justify: start, center, end, to align along the major axis
boxes use align: start, center, end, stretch, to align across the minor axis
boxes: gap for the space between items

children (including boxes, but also all other components)
    flex: 0 to 1.0 to allocate any extra space beyond the minimum
        default value is 0.
        what is the default size of a component?



three phases:

a preferred size can be a pixel value or a keyword 'auto', which means it doesn't care and should defer to the algorithms.
the flexbox, by default, has auto preferred sizes
the developer can assign a concrete value to the preferred size to force it to stay at that size

measure:
    ask each child what it's preferred size. this is stored in the child's preferred width and height properties
    calculate a self minimum preferred size based on the child preferred sizes and flex settings
    BOTTOM UP phase. child leafs calculate sizes, then their parents do
layout:
    set self size based on the calculated preferred size
    calculate excess space
    set size and positions of children
    TOP DOWN phase. parents do layout first then position their children
draw:
    draw the static tree
    TOP DOWN: recursively draw the tree. no positions or sizes are changed

algorithm:
box.layout
    ask each child to layout itself. they should be at their preferred size then
    calculate excess space
    position children based on gap and desired alignment settings
    resize children that are given excess space based on alignment settings
    resize children that are given excess space based on stretch settings

    done. now drawing can begin.
this is recursive but still does layout on each child only once.


examples:
* vbox
    hbox grow
        vbox grow
            hbox grow
                button
all should be sized to fill the window, including when resizing

* box dir:column align:stretch
    box#toolbar dir:row align:center
    box#wrapper dir:row grow align:stretch
        box#sidebar dir:column pwidth:100px align:end
        box#content dir:column justify:end
all should be sized to fill the window, including when resizing

* box dir:column align:stretch justify:stretch
    tabpanel

test align: start, center, end, stretch
test justify: start, center, end, stretch

CSS algorithm
determine the available main and cross space for the container
determine main size for each child item

 */
export class VBox extends Container {
    constructor(opts) {
        super(opts);
        this.gap = opts.gap || 2
        this.name = 'panel'
        this.preferred_width = opts.width || 10
        this.preferred_height = opts.height || 10
        this.direction = "column"
        this.align = opts.align || 'start'
        this.justify = opts.justify || "start"
        this.fill_color = opts.fill_color
    }
    layout(gfx) {
        this.children.forEach(ch => ch.layout(gfx))
        this.width = this.preferred_width
        this.height = this.preferred_height
        console.log("vbox layout ",this.id,this.direction,
            `${this.width} x ${this.height}`,
            `pos: maj: ${this.justify} min: ${this.align}`
        )
        let v1 = this.gap
        let max_girth = 0
        this.children.forEach(ch => {
            v1 += this.getMainSize(ch)
            v1 += this.gap
            let girth = this.getCrossSize(ch)
            if(girth > max_girth) max_girth = girth
        })
        let leftover = this.getMainSize(this) - v1
        // console.log("leftover is",this.id,this.getChildSize(this),leftover)
        if(v1 > this.getPreferredMainSize()) {
            console.log(this.id,"expanding major length to fit children",v1)
            this.setMainSize(this,v1)
        } else {
            this.setMainSize(this,this.getPreferredMainSize())
        }

        // console.log(this.id,"greatest minor axis:",max_girth)
        if(max_girth > this.getCrossSize(this)) {
            console.log(this.id,"expanding minor length to fit children",max_girth)
            this.setCrossSize(this, max_girth)
        }
        //position children using excess space
        let v2 = this.gap
        this.children.forEach(ch => {
            this.setMainStart(ch,v2)
            let ch_v = this.getMainSize(ch)
            if(ch.flex === 1) {
                console.log(this.id,'giving leftover to flex child',ch.id)
                this.setMainSize(ch,ch_v + leftover*1.0)
            }
            v2 += this.getMainSize(ch)
            v2 += this.gap

            if(this.align === 'stretch') {
                this.setCrossSize(ch,this.getCrossSize(this)-this.gap-this.gap)
                console.log(this.id,'doing stretch align',this.getCrossSize(ch),'to child',ch.id)
            }
            if(this.align === 'end') {
                // console.log(this.id,'doing end align')
                let z = this.getCrossSize(this) - this.getCrossSize(ch)
                // console.log(this.getChildGirth(this),this.getChildGirth(ch),z)
                this.setMainStart(ch,z)
            }
        })
        console.log(this.id,`pref size ${this.preferred_width} x ${this.preferred_height} actual ${this.width} x ${this.height}`)
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

    setMainStart(ch, v) {
        if(this.direction === 'row') {
            ch.x = v
        }
        if(this.direction === 'column') {
            ch.y = v
        }
    }

    getMainStart(ch) {
        if(this.direction === 'row') {
            return ch.x
        }
        if(this.direction === 'column') {
            return ch.y
        }
    }

    getMainSize(ch) {
        if(this.direction === 'row') {
            return ch.width
        }
        if(this.direction === 'column') {
            return ch.height
        }
    }

    setMainSize(ch, v) {
        if(this.direction === 'row') {
            ch.width = v
        }
        if(this.direction === 'column') {
            ch.height = v
        }
    }

    setCrossSize(ch, v) {
        if(this.direction === 'row') {
            ch.height = v
        }
        if(this.direction === 'column') {
            ch.width = v
        }
    }

    getCrossSize(ch) {
        if(this.direction === 'row') {
            return ch.height
        }
        if(this.direction === 'column') {
            return ch.width
        }
    }

    getPreferredMainSize() {
        if(this.direction ===  'row') return this.preferred_width
        if(this.direction === 'column') return this.preferred_height
    }
}

export class HBox extends VBox {
    constructor(opts) {
        super(opts);
        this.direction = 'row'
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
        this.flex = 1.0
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
