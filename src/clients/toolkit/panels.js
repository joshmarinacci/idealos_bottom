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

export class VBox extends Container {
    constructor(opts) {
        super(opts);
        this.border_width = opts.border_width || 0
        this.padding = opts.padding || 0
        this.hstretch = opts.hstretch || false
        this.name = 'panel'
    }
    layout(gfx) {
        this.children.forEach(ch => ch.layout(gfx))
        let y = this.padding
        let maxx = this.padding
        this.children.forEach(ch => {
            ch.x = this.padding
            ch.y = y
            y += ch.height
            y += this.padding
            maxx = Math.max(maxx,this.padding+ch.width+this.padding)
        })
        if(this.hstretch) {
            this.children.forEach(ch => ch.width = maxx)
        }
        this.width = maxx
        this.height = y
    }
    redraw(gfx) {
        let bg = this.lookup_theme_part("background-color")
        gfx.rect(0,0,this.width,this.height,bg)
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
