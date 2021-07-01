import assert from 'assert'
import fs from 'fs'
import {JoshFont} from '../src/clients/toolkit/guitoolkit.js'
import {BIAS, TextLayout} from '../src/clients/toolkit/text.js'


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

    it("lays out with word breaks",() => {
        let tl = new TextLayout()
        tl.text = "hello there mister man\nhow are you doing?"
        //         01234567890123456789012345678901234567890
        //hello there
        //mister man
        //how are you
        //doing?
        tl.layout_as_blocks_with_breaks(14)
        assert(tl.lines[0] === 'hello there ')
        assert(tl.lines[1] === 'mister man\n')
        assert(tl.lines[2] === 'how are you ')
        assert(tl.lines[3] === 'doing?')
    })
    it("lays out with font word breaks",async () => {
        let font_data = JSON.parse((await fs.promises.readFile("resources/fonts/font.json")).toString())
        let font = new JoshFont(font_data)
        let tl = new TextLayout()
        tl.text = "hello there mister man\nhow are you doing?"
        //         01234567890123456789012345678901234567890
        //hello there
        //mister man
        //how are you
        //doing?
        tl.layout_as_blocks_with_breaks_and_font(60,font)
        assert(tl.lines[0] === 'hello there ')
        assert(tl.lines[1] === 'mister man\n')
        assert(tl.lines[2] === 'how are ')
        assert(tl.lines[3] === 'you doing?')
    })
})
