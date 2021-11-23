import {DataBase} from "../src/server/db/db";
import {CATEGORIES} from "../src/server/db/schema";
import expect from "expect";
import {promises as fs} from "fs";
import path from "path"
import {CloudDBService} from "../src/server/db2/clouddb";

async function load_file_size(file: string) {
    let stat = await fs.stat(file)
    return stat.size
}

describe("db tests",() => {

    it("will fail because there is no DB", async () => {
        let db = new CloudDBService({
            connect:"some_connection_string",
            dbname:"testdb",
            create:true,
            recreate:false,
        })
        await db.start()
        let valid = await db.check_connection()
        expect(valid).toBe(false)
    })
    it('will load an mp3 file', async () => {
        let db = new CloudDBService({
            connect:"some_connection_string",
            dbname:"testdb",
            create:true,
            recreate:false,
        })
        await db.start()
        let file = path.resolve("test/resource/mp3/test1.mp3")
        let doc = await db.ingest(file)
        expect(doc.mimetype).toBe('audio/mp3')
        let list = await db.find("type = music") as any[]
        expect(list.length).toBe(1)
        let item = list[0]
        expect(item.attachments.length).toBe(1)
        let size = await load_file_size(file)
        expect(item.attachments[0].size).toBe(size)
        let data = await db.load_attachment(item.attachments[0].id)
        expect(data.length).toBe(size)

        await db.delete("testdb")
        await db.stop()
    })
})

