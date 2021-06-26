import {Container} from './guitoolkit.js'
import {ToggleButton} from './buttons.js'

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
            this.children.forEach(ch => {
                ch.x = this.padding
                ch.y = y
                y += ch.height
                y += this.padding
            })
            let maxx = this.width - this.padding
            if (this.hstretch) {
                this.children.forEach(ch => ch.width = maxx)
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
    }
    layout(gfx) {
        this.children.forEach(ch => ch.layout(gfx))
        let x = this.padding
        let maxy = this.padding
        this.children.forEach(ch => {
            if(!ch.visible) return
            ch.x = x
            ch.y = this.padding
            x += ch.width
            x += this.padding
            maxy = Math.max(maxy,this.padding+ch.height+this.padding)
        })
        this.width = x
        this.height = maxy
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
        gfx.rect(this.x,this.y,this.width,this.height,'cyan')
        super.redraw(gfx)
    }

    select_tab(n) {
        this.selected_index = n
        this.tab_buttons.forEach((btn,i)=> btn.selected = (i===this.selected_index))
        this.repaint()
    }
}
