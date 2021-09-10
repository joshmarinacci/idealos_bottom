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
    ask each child what it's preferred size.
        this is stored in the child's preferred width and height properties
    calculate a self minimum preferred size
        based on the child preferred sizes and flex settings
    BOTTOM UP phase. child leaves calculate sizes, then their parents do
    preferred sizes to calculated sizes

layout:
    set self size based on the calculated preferred size
    calculate excess space
    set size and positions of children
    TOP DOWN phase. parents do layout first then position their children
    calculated sizes to final sizes

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


nested boxes
outer preferred size is from window
middle preferred size is from children
    calculates from children in measure using pref or calc
    sets preferred size to children min
inner preferred size is from children
    calculates from children in measure.
    sets calculated size to children min
tiny (button) preferred size is intrinsic.
    stored as this.pref

 */
export class VBox extends Container {
    constructor(opts) {
        super(opts);
        this.gap = opts.gap || 0
        this.name = 'panel'
        this.preferred_width = opts.width || 'auto'
        this.preferred_height = opts.height || 'auto'
        this.direction = "column"
        this.align = opts.align || 'start'
        this.justify = opts.justify || "start"
        this.fill_color = opts.fill_color
    }
    metrics() {
        return  this.id + ` ${this.direction}   `
            + `pref ${this.getPreferredMainSize(this)} x ${this.getPreferredCrossSize(this)}   `
            + `calc ${this.getCalculatedMainSize(this)} x ${this.getCalculatedCrossSize(this)}   `
            + `actu ${this.getActualMainSize(this)} x ${this.getCrossSize(this)}   `
        + `pos ${this.getMainStart(this)},${this.getCrossStart(this)}`
    }
    measure(gfx) {
        //ch.calc + this.pref => this.calc
        //reset child calculations
        this.children.forEach(ch => {
            ch.calculated_height = 10
            ch.calculated_width = 10
            ch.width = 10
            ch.height = 10
        })
        this.children.forEach(ch => ch.measure(gfx))
        // console.log("MEASURE START", this.metrics())

        // measure the minimum space needed for the main axis
        let min_main = this.gap
        let total_flex = 0
        this.children.forEach(ch => {
            min_main += this.getCalculatedMainSize(ch)
            min_main += this.gap
            total_flex += ch.flex
        })
        let leftover_main = 0
        if(this.getPreferredMainSize(this) !== 'auto') {
            let m = this.getPreferredMainSize(this) - this.gap*2
            leftover_main = m-min_main
            // console.log("leftover is going to be",m,min_main,leftover_main)
        } else {
            leftover_main = 0
        }
        this.leftover_main = leftover_main
        this.total_flex = total_flex
        this.min_main = min_main
        this.setCalculatedMainSize(this,min_main)

        //calc max cross size
        let max_cross = 0
        this.children.forEach(ch => {
            let size = this.getCalculatedCrossSize(ch)
            if(size > max_cross) max_cross = size
        })
        this.max_cross = max_cross + this.gap*2
        if(this.getPreferredCrossSize(this) === 'auto') {
            this.setCalculatedCrossSize(this, this.max_cross)
        } else {
            this.setCalculatedCrossSize(this,this.getPreferredCrossSize(this))
        }

        //adjust any stretch children to the calculated cross size
        this.children.forEach(ch => {
            if(this.align === 'stretch') {
                this.setCalculatedCrossSize(ch,this.getCalculatedCrossSize(this)-this.gap*2)
                // console.log(this.id,'stretching child',ch.id,'to',this.getCalculatedCrossSize(ch))
            }
        })


        // console.log('MEASURE END', this.metrics(), ` total flex = ${this.total_flex} leftover${this.leftover_main}`)
    }
    layout(gfx) {
        //set children based on self's actual size.
        // console.log("LAYOUT START", this.id, this.metrics(), 'total flex',this.total_flex, 'min_main',this.min_main, 'leftover',this.leftover_main)


        // main axis

        if(this.total_flex > 0) {
            // console.log(this.id,'doing flex')
            //layout main axis if doing flex sizing
            let v = this.gap
            this.children.forEach(ch => {
                // console.log(this.id,'putting child',ch.id,'at main start = ',v)
                this.setMainStart(ch,v)
                let vv = this.getCalculatedMainSize(ch)
                let fract = this.leftover_main/this.total_flex * ch.flex
                // console.log("extra is",fract, 'for',ch.id)
                this.setActualMainSize(ch,vv+fract)
                v += (vv+fract)
                v += this.gap
            })
        } else {
            // console.log(this.id,'doing regular')
            // layout main axis with positioning
            let v = this.gap
            //justify = start
            if(this.justify === 'start') {
                v += 0
            }
            if(this.justify === 'center') {
                v += this.leftover_main/2
            }
            if(this.justify === 'end') {
                v += this.leftover_main
            }
            this.children.forEach(ch => {
                this.setMainStart(ch,v)
                this.setActualMainSize(ch, this.getCalculatedMainSize(ch))
                v += this.getActualMainSize(ch)
                v += this.gap
            })
        }


        //layout the cross axis
        this.children.forEach(ch => {
            // console.log('cross',this.id,ch.id,this.getCrossSize(ch),this.getCalculatedCrossSize(ch),'this',this.getCalculatedCrossSize(this), this.getCrossSize(this))
            this.setCrossSize(ch,this.getCalculatedCrossSize(ch))
            if(this.align === 'stretch') {
                this.setCrossSize(ch,this.getCrossSize(this))
            }
            this.setCrossStart(ch,this.gap)
            if(this.align === 'center'){
                this.setCrossStart(ch,(this.getCrossSize(this)-this.getCrossSize(ch))/2)
            }
            if(this.align === 'end'){
                this.setCrossStart(ch,this.getCrossSize(this)-this.gap-this.getCrossSize(ch))
            }
        })

        this.children.forEach(ch => ch.layout(gfx))
        // console.log("LAYOUT END", this.metrics())
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
            ch.x = Math.floor(v)
        }
        if(this.direction === 'column') {
            ch.y = Math.floor(v)
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

    getActualMainSize(ch) {
        if(this.direction === 'row') {
            return ch.width
        }
        if(this.direction === 'column') {
            return ch.height
        }
    }
    setActualMainSize(ch, v) {
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
    setCrossStart(ch, v) {
        if(this.direction === 'row') ch.y = Math.floor(v)
        if(this.direction === 'column') ch.x = Math.floor(v)
    }
    getCrossStart(ch, v) {
        if(this.direction === 'row') return ch.y
        if(this.direction === 'column') return ch.x
    }
    getCrossSize(ch) {
        if(this.direction === 'row') return ch.height
        if(this.direction === 'column') return ch.width
    }

    getPreferredMainSize(ch) {
        if(this.direction ===  'row') return ch.preferred_width
        if(this.direction === 'column') return ch.preferred_height
    }
    getPreferredCrossSize(ch) {
        if(this.direction ===  'row') return ch.preferred_height
        if(this.direction === 'column') return ch.preferred_width
    }

    getCalculatedMainSize(ch) {
        if(this.direction ===  'row') return ch.calculated_width
        if(this.direction === 'column') return ch.calculated_height
    }

    setCalculatedMainSize(ch, v) {
        if(this.direction ===  'row') ch.calculated_width = v
        if(this.direction === 'column') ch.calculated_height = v
    }

    getCalculatedCrossSize(ch) {
        if(this.direction ===  'row') return ch.calculated_height
        if(this.direction === 'column') return ch.calculated_width
    }

    setCalculatedCrossSize(ch, v) {
        if(this.direction ===  'row')   ch.calculated_height = v
        if(this.direction === 'column') ch.calculated_width  = v
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
    measure(gfx) {
        this.children.forEach(ch => {
            ch.calculated_height = 10
            ch.calculated_width = 10
            ch.width = 10
            ch.height = 10
        })
        this.children.forEach(ch => ch.measure(gfx))
        if(this.preferred_width === 'auto') {
            this.calculated_width = 50
        } else {
            this.calculated_width = this.preferred_width
        }
        if(this.preferred_height === 'auto') {
            this.calculated_height = 50
        } else {
            this.calculated_height = this.preferred_height
        }
    }
    layout(gfx) {
        let mx = 0
        let mh = 0
        this.tab_buttons.forEach(bt => {
            bt.x = mx
            mx = Math.max(bt.x+bt.preferred_width,mx)
            bt.y = 0
            mh = Math.max(bt.preferred_height,mh)
            bt.width = bt.preferred_width
            bt.height = bt.preferred_height
            bt.layout(gfx)
        })
        this.tab_children.forEach((comp,i) => {
            comp.visible = (i===this.selected_index)
            comp.x = 0
            comp.y = mh
            comp.width = this.width
            comp.height = this.height - mh
            comp.layout(gfx)
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
        this.preferred_width = opts.width || 'auto'
        this.preferred_height = opts.width || 'auto'
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
    measure(gfx) {
        super.measure(gfx)
        //set calculated
        this.calculated_width = this.preferred_width
        this.calculated_height = this.preferred_height
    }
    layout(gfx) {
        this.content.forEach(ch => ch.width = this.width - this.sw)
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
        this.fill_color = opts.fill_color
        this.name = 'list-view'
        this.data = opts.data
        this.template_function = opts.template_function
        this.children = []
        this.generated = false
        this.selected_index = 0
        this.preferred_width = opts.width || 'auto'
        this.preferred_height = opts.height || 'auto'
    }
    measure(gfx) {
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

        //reset and measure children
        this.children.forEach(ch => {
            ch.calculated_height = 10
            ch.calculated_width = 10
            ch.width = 10
            ch.height = 10
        })
        this.children.forEach(ch => ch.measure(gfx))

        let lh = 21
        if(this.preferred_width === 'auto') {
            this.calculated_width = 50
        } else {
            this.calculated_width = this.preferred_width
        }
        this.preferred_height = this.children.length*lh
        this.calculated_height = this.preferred_height
    }
    layout(gfx) {
        super.layout(gfx)
        let lh = 21
        this.children.forEach((ch,i) => {
            ch.x = 0
            ch.y = i*lh
            ch.height = lh-1
            ch.width = this.width
        })
    }
    redraw(gfx) {
        let bg = this.lookup_theme_part("background-color",null)
        if(this.fill_color) bg = this.fill_color
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
