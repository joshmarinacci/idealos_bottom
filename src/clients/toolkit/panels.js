import {Container} from './guitoolkit.js'

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
            gfx.rect(0,0,this.width,this.height,this.fill_color)
        } else {
            let bg = this.lookup_theme_part("background-color")
            gfx.rect(0, 0, this.width, this.height, bg)
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
