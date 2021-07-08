import assert from "assert";
import {FontManager, JFont, read_json} from "../src/server/FontManager.js";
import * as fs from "fs";
import path from "path";
import * as os from "os";


async function copy_to_temp(good_font_path: string): Promise<string> {
    let tempdir = await fs.promises.mkdtemp(path.join(os.tmpdir(),"fonts"))
    let new_path = path.join(tempdir,"test.json")
    let data = await fs.promises.readFile(good_font_path)
    await fs.promises.writeFile(new_path,data)
    return new_path
}

async function write_json(temp: string, json: any) {
    await fs.promises.writeFile(temp,JSON.stringify(json))
}

describe('font manager',function() {

    it('loads one font', async function () {
        //init font manager
        let fm = new FontManager(null);
        //specify a single font
        fm.watch_font_from_paths("base",[
            'test/resources/fonts/font1.json'
        ])
        //fetch a single merged font
        let font:JFont = await fm.get_font("base")
        console.log("font is",font)
        //confirm it has the correct number of glyphs
        assert.strictEqual(font.info.glyphs.length,1)
        fm.shutdown()
    })

    it("watches for changes", async function () {
        //init font manager
        let fm = new FontManager(null);
        let good_font_path = "test/resources/fonts/font1.json"
        let temp = await copy_to_temp(good_font_path)
        //specify a font
        fm.watch_font_from_paths("base",[ temp ])
        //confirm glyph count
        let font:JFont
        font = await fm.get_font("base")
        assert.strictEqual(font.info.glyphs.length,1)
        //load font as JSON
        let json = await read_json(temp)
        //append glyph
        json.glyphs.push({
            "id": 66,
            "name": "B",
            "width": 10,
            "height": 10,
            "baseline": 8,
            "data":[],
            "ascent": 8,
            "descent": 2,
            "left": 2,
            "right": 2
        })
        //write back to file
        await write_json(temp,json)
        //wait for font manager event
        let evt = await fm.wait_for_event("font-update")
        assert.deepStrictEqual(evt,{
            type:"font-update",
            success:true,
            fontname:"base"
        })
        //get font from manager
        font = await fm.get_font("base")
        //confirm it has the extra glyph
        assert.strictEqual(font.info.glyphs.length,2)
        fm.shutdown()
    })

    it('watches for bad fonts', async function() {
        //init font manager
        let fm = new FontManager(null);
        //specify font
        let good_font_path = "test/resources/fonts/font1.json"
        let temp = await copy_to_temp(good_font_path)
        //specify a font
        fm.watch_font_from_paths("base",[ temp ])
        //confirm glyph count
        let font
        font = await fm.get_font("base")
        assert.strictEqual(font.info.glyphs.length,1)
        //write garbage to the font
        await write_json(temp,`{ "foo":"bar} `)
        //wait for bad font event
        let evt = await fm.wait_for_event("font-update")
        assert.deepStrictEqual(evt,{
            type:"font-update",
            success:false,
            fontname:"base"
        })
        //fetch font
        //confirm font is still good by looking at the glyph count
        font = await fm.get_font("base")
        assert.strictEqual(font.info.glyphs.length,1)
        fm.shutdown()
    })
/*
    it('groups two fonts', async function () {
        //init font manager
        let fm = new FontManager(null,null);
        //specify two fonts in a single group
        //specify a font
        let font1 = "test/resources/fonts/font1.json"
        let font2 = "test/resources/fonts/font2.json"
        let temp = copy_to_temp(font2)
        fm.watch_font_from_paths("base",[ font1, temp ])
        //confirm glyph count is the merger of both
        let font = await fm.get_font("base")
        assert.strictEqual(font.glyphs.length,3)
        //write new file to replace one of the fonts with fewer glyphs
        let json = await read_json(temp)
        json.glyphs.pop()
        await write_json(temp,json)
        //wait for update event
        let evt = await fm.wait_for_event("font-update")
        assert.deepStrictEqual(evt,{
            type:"font-update",
            success:true,
            fontname:"base"
        })
        //get virtual font
        let font = await fm.get_font("base")
        //confirm it has the shorter length
        assert.strictEqual(font.glyphs.length,2)
        fm.shutdown()
    })
*/
})


