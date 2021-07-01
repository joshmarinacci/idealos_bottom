/*

given text and font and width and height, perform layout
layout breaks into lines

* set cursor at start, bias left
    * cursor should be 0
    * bias should be left
    * nav left
    * cursor should be 0
    * bias should be left



* set cursor at 4, bias right
    * cursor should be at 4
    * bias should be right
    * nav right
    * cursor should be at 6
    * bias should be right


* text=AB/CD/EFG, width=30, cursor=1, bias=left
    * nav right
    * cursor should be at 1
    * bias should be right

* text=AB/CD/EFG, width=30, cursor=1, bias=right
    * nav right
    * cursor should be at 2
    * bias should be left

* text=AB/CD/EFG, width=30, cursor=6, bias=left
    * nav right
    * cursor should be at 6
    * bias should be right

* text=AB/CD/EFG, width=30, cursor=6, bias=right
    * nav right
    * cursor should be at 6
    * bias should be right

* text=AB/CD/EFG, width=30, cursor=6, bias=right
    * nav left
    * cursor should be at 6
    * bias should be left
*/

import assert from 'assert'

const BIAS = {
    LEFT:'LEFT',
    RIGHT:'RIGHT',
}

class TextLayout {
    constructor() {
        this.text = ""
        this.cursor = 0
        this.bias = BIAS.LEFT
        this.lines = [""]
    }
    layout_as_blocks(w) {
        this.lines = []
        let x = 0
        let y = 0
        let line = ""
        for(let i=0; i<this.text.length; i++) {
            let ch = this.text[i]
            line += ch
            let met = {width: 1}
            x += met.width
            if(x >= w) {
                x = 0
                this.lines.push(line)
                line = ""
                y += 10
            }
        }
        this.lines.push(line)
    }

    nav_left() {
        if(this.bias === BIAS.RIGHT) {
            this.bias = BIAS.LEFT
            return
        }
        if(this.bias === BIAS.LEFT) {

            let lc = this.cursor_to_lc(this.cursor)
            if(lc.col === 0 && lc.line === 0) {
                this.cursor = 0
                this.bias = BIAS.LEFT
                return
            }
            if(lc.col === 0) {
                this.cursor--
                this.bias = BIAS.RIGHT
                return
            }

            this.cursor--
            if(this.cursor < 0) {
                this.cursor = 0
            }
            return
        }
    }

    cursor_to_lc(cursor) {
        let len = 0
        let n = 0
        for(let line of this.lines) {
            if(this.cursor >= len && this.cursor < len + line.length) {
                break;
            }
            len += line.length
            n+=1
        }
        return {
            line:n,
            col:cursor-len
        }
    }

    nav_right() {
        if(this.bias === BIAS.LEFT) {
            this.bias = BIAS.RIGHT
            return
        }
        let lc = this.cursor_to_lc(this.cursor)
        //should wrap
        if(lc.col === this.lines[lc.line].length-1 && lc.line < this.lines.length-1 ) {
            this.cursor++
            this.bias = BIAS.LEFT
            return
        }
        //move on same line
        if(lc.col < this.lines[lc.line].length-1) {
            this.cursor++
        }
    }
}

describe("text navigation",() => {
    it("navigates left",() => {
        let tl = new TextLayout()
        tl.text = "ABCDEFG"
        // ABC DEF G
        // 012 345 6
        tl.layout_as_blocks(3)
        tl.cursor = 0
        tl.bias = BIAS.LEFT
        assert(tl.bias===BIAS.LEFT)
        assert(tl.cursor===0)
        assert(tl.lines.length === 3)
        console.log(tl.lines)
        assert(tl.lines[0] === 'ABC')
        assert(tl.lines[1] === 'DEF')
        assert(tl.lines[2] === 'G')

        //move left from end of text with right bias, switch bias
        tl.cursor = 6
        tl.bias = BIAS.RIGHT
        tl.nav_left()
        assert(tl.cursor===6)
        assert(tl.bias === BIAS.LEFT)

        //move left from start of 3rd line with left bias, wrap to previous line
        tl.cursor = 6
        tl.bias = BIAS.LEFT
        tl.nav_left()
        assert(tl.cursor===5)
        assert(tl.bias === BIAS.RIGHT)

        //move left from start of 2nd line with right bias
        tl.cursor = 3
        tl.bias = BIAS.RIGHT
        tl.nav_left()
        assert(tl.cursor===3)
        assert(tl.bias === BIAS.LEFT)

        //move left from start of 2nd line with left bias
        tl.nav_left()
        assert(tl.cursor===2)
        assert(tl.bias === BIAS.RIGHT)

        //move left from middle with right bias
        tl.cursor = 2
        tl.bias = BIAS.RIGHT
        tl.nav_left()
        assert(tl.cursor===2)
        assert(tl.bias === BIAS.LEFT)
        //move left
        tl.nav_left()
        assert(tl.cursor===1)
        assert(tl.bias === BIAS.LEFT)
        //move left
        tl.nav_left()
        assert(tl.cursor===0)
        assert(tl.bias === BIAS.LEFT)
        //move left
        tl.nav_left()
        assert(tl.cursor===0)
        assert(tl.bias === BIAS.LEFT)
    })

    it("navigates right",() => {
        let tl = new TextLayout()
        tl.text = "ABCDEFG"
        // ABC DEF G
        // 012 345 6
        tl.layout_as_blocks(3)
        tl.cursor = 0
        tl.bias = BIAS.LEFT
        assert(tl.bias===BIAS.LEFT)
        assert(tl.cursor===0)

        //move right from the start, just change bias
        tl.nav_right()
        assert(tl.cursor===0)
        assert(tl.bias===BIAS.RIGHT)


        //move right from the middle, just changes bias
        tl.cursor = 1
        tl.bias = BIAS.LEFT
        tl.nav_right()
        assert(tl.cursor===1)
        assert(tl.bias===BIAS.RIGHT)

        //move right from middle when already bias right, moves cursor
        tl.cursor = 1
        tl.bias = BIAS.RIGHT
        tl.nav_right()
        assert(tl.cursor===2)
        assert(tl.bias===BIAS.RIGHT)

        //move right next to end of line when bias is left, just changes bias
        tl.cursor = 2
        tl.bias = BIAS.LEFT
        tl.nav_right()
        assert(tl.cursor===2)
        assert(tl.bias===BIAS.RIGHT)
        assert(tl.cursor_to_lc(2).line===0)
        assert(tl.cursor_to_lc(2).col===2)

        //move right at end of line when bias is right, now wrap around
        tl.cursor = 2
        tl.bias = BIAS.RIGHT
        tl.nav_right()
        assert(tl.cursor===3)
        assert(tl.bias===BIAS.LEFT)
        assert(tl.cursor_to_lc(3).line===1)
        assert(tl.cursor_to_lc(3).col===0)

        //move right at start of second line when bias is left, just change bias
        tl.cursor = 3
        tl.bias = BIAS.LEFT
        tl.nav_right()
        // assert(tl.cursor===3)
        // assert(tl.bias===BIAS.RIGHT)
        // assert(tl.cursor_to_lc(3).line===1)
        // assert(tl.cursor_to_lc(3).col===1)

        //move right at end of second line when bias is right, wrap around
        tl.cursor = 5
        tl.bias = BIAS.RIGHT
        tl.nav_right()
        assert(tl.cursor===6)
        assert(tl.bias==BIAS.LEFT)
        assert(tl.cursor_to_lc(6).line===2)
        assert(tl.cursor_to_lc(6).col===0)

        //move right at start of 3rd line when bias is left, adjust bias
        tl.cursor = 6
        tl.bias = BIAS.LEFT
        tl.nav_right()
        assert(tl.cursor===6)
        assert(tl.bias===BIAS.RIGHT)
        assert(tl.cursor_to_lc(6).line===2)
        assert(tl.cursor_to_lc(6).col===0)

        //move right at start of 3rd line when bias is right, end of text. stay here
        tl.cursor = 6
        tl.bias = BIAS.RIGHT
        tl.nav_right()
        assert(tl.cursor===6)
        assert(tl.bias===BIAS.RIGHT)
        assert(tl.cursor_to_lc(6).line===2)
        assert(tl.cursor_to_lc(6).col===0)

        // ABC DEF G
        // 012 345 6
    })
})
