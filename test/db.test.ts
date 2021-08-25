import {CATEGORIES} from "../src/server/db/schema.js"
import {DataBase} from '../src/server/db/db.js'
import expect from "expect"
import {promises as fs} from "fs"
import {AND, IS_PROP_TRUE, IS_TYPE} from '../src/server/db/query.js'


describe("db tests",() => {

    it('will find all chat messages', async () => {
        let db = new DataBase()
        await db.start()
        await db.load_json("test/resources/db.chats.json")
        let res = db.QUERY({
            and: [
                {
                    TYPE: CATEGORIES.CHAT.TYPES.MESSAGE

                },
                {
                    CATEGORY: CATEGORIES.CHAT.ID
                }
            ]
        })
        // assert.strictEqual(res.length, 4)
        expect(res.length).toBe(4)
        await db.stop()
    })

    it('find all items where first or last contains the substring "mar"', async () => {
        let db = new DataBase()
        await db.start()
        await db.load_json("test/resources/db.contacts.json")
        let res = db.QUERY({
            or: [
                {
                    substring: {
                        prop: 'first',
                        value: 'arin'
                    },
                },
                {
                    substring: {
                        prop: 'last',
                        value: 'arin'
                    }
                }
            ]
        })
        expect(res.length).toBe(2)
        await db.stop()
    })

    it("succeed even with a broken json file", async () => {
        let db = new DataBase()
        await db.start()
        await db.load_json("test/resources/db.chats.json")
        await db.load_json("test/resources/db.json_broken.json")
        let res = db.QUERY({
            and: [
                {
                    TYPE: CATEGORIES.CHAT.TYPES.MESSAGE

                },
                {
                    CATEGORY: CATEGORIES.CHAT.ID
                }
            ]
        })
        // assert.strictEqual(res.length, 4)
        expect(res.length).toBe(4)
        await db.stop()
    })

    it("don't let invalid data in", async () => {
        let db = new DataBase()
        await db.load_json("test/resources/db.schema_broken.json")
        await db.start()
        let res = db.QUERY({
            and: [
                {
                    TYPE: CATEGORIES.CHAT.TYPES.MESSAGE

                },
                {
                    CATEGORY: CATEGORIES.CHAT.ID
                }
            ]
        })
        expect(res.length).toBe(1)
        await db.stop()
    })

    // it("auto-reload when json file changes", async () => {
    //     //read test data
    //     let data = JSON.parse((await fs.readFile("test/resources/db.chats.json")).toString())
    //     //make temp file
    //     let temp_file = "test/temp.json"
    //     //write to temp file
    //     await fs.writeFile(temp_file,JSON.stringify(data,null,"  "))
    //     await sleep(250)
    //     let db = new DataBase()
    //     //watch temp file
    //     await db.watch_json(temp_file)
    //     await db.start()
    //     {
    //         let res = db.QUERY({
    //             and: [
    //                 {
    //                     TYPE: CATEGORIES.CHAT.TYPES.MESSAGE
    //
    //                 },
    //                 {
    //                     CATEGORY: CATEGORIES.CHAT.ID
    //                 }
    //             ]
    //         })
    //         expect(res.length).toBe(4)
    //     }
    //
    //     //append new data and write to temp file
    //     data.push({
    //             "id":66,
    //             "category": "CATEGORIES.CHAT.ID",
    //             "type": "CATEGORIES.CHAT.TYPES.MESSAGE",
    //             "props": {
    //                 "sender":1,
    //                 "contact":1
    //             }
    //         })
    //     await fs.writeFile(temp_file,JSON.stringify(data,null,"  "))
    //     await sleep(250)
    //     //verify new data
    //     {
    //         let res = db.QUERY({
    //             and: [
    //                 {
    //                     TYPE: CATEGORIES.CHAT.TYPES.MESSAGE
    //
    //                 },
    //                 {
    //                     CATEGORY: CATEGORIES.CHAT.ID
    //                 }
    //             ]
    //         })
    //         expect(res.length).toBe(5)
    //     }
    //
    //     let updated = false
    //     //add event listener
    //     db.addEventListener(CATEGORIES.CHAT.ID,()=>{
    //         updated = true
    //         console.log("chat category is updated")
    //     })
    //     //append new data and write to temp file
    //     data.push({
    //         "id":67,
    //         "category": "CATEGORIES.CHAT.ID",
    //         "type": "CATEGORIES.CHAT.TYPES.MESSAGE",
    //         "props": {
    //             "sender":1,
    //             "contact":1
    //         }
    //     })
    //     await fs.writeFile(temp_file,JSON.stringify(data))
    //     await sleep(250)
    //     //wait for event trigger
    //     {
    //         let res = db.QUERY({
    //             and: [
    //                 {
    //                     TYPE: CATEGORIES.CHAT.TYPES.MESSAGE
    //
    //                 },
    //                 {
    //                     CATEGORY: CATEGORIES.CHAT.ID
    //                 }
    //             ]
    //         })
    //         expect(res.length).toBe(6)
    //     }
    //
    //     expect(updated).toBe(true)
    //
    //     //shutdown
    //     await db.stop()
    //
    //     //delete temp file
    //     await fs.rm(temp_file)
    // })
    //
    //
    // //compound AND and OR query
    it('find all contacts.people where first or last contains the substring "Mar"', async () => {
        let db = new DataBase()
        await db.load_json("test/resources/db.contacts.json")
        await db.start()
        let res = db.QUERY({
            and: [
                {
                    TYPE: CATEGORIES.CONTACT.TYPES.PERSON,

                },
                {
                    CATEGORY: CATEGORIES.CONTACT.ID
                },
                {
                    or: [
                        {
                            substring: {
                                prop: 'first',
                                value: 'Mar'
                            },
                        },
                        {
                            substring: {
                                prop: 'last',
                                value: 'Mar'
                            }
                        }
                    ]
                }
            ]
        })
        expect(res.length).toBe(2)
        await db.stop()
    })


    //find all notes where archived is true
    it('archived tasks', async () => {
        let db = new DataBase()
        await db.start()
        await db.load_json("test/resources/db.tasks.json")
        const res = db.QUERY(AND(
            IS_TYPE(CATEGORIES.TASKS.TYPES.TASK),
            IS_PROP_TRUE("archived"),
        ))
        expect(res.length).toBe(1)
        await db.stop()
    })


    //test shadowing
    //load db from test data and test changes dir
    //add an object
    //verify object really there
    //shutdown
    //verify test data doesn't have the change
    //start db
    //load up again using changes dir adn test data
    //verify object really there
    //shutdown db
    it("persists changes", async() => {
        let db = new DataBase()
        let temp_dir = await fs.mkdtemp("joshtemp")
        db.set_changes_dir(temp_dir)
        await db.load_json("test/resources/db.tasks.json")
        await db.start()
        expect(db.QUERY((AND(IS_TYPE(CATEGORIES.TASKS.TYPES.TASK)))).length).toBe(4)
        await db.add_object({
            "category": "CATEGORIES.TASKS.ID",
            "type": "CATEGORIES.TASKS.TYPES.TASK",
            "props": {
                "title": "another task task",
                "project": 6,
                "completed": true,
                "archived": false,
                "deleted": false
            }
        })
        expect(db.QUERY((AND(IS_TYPE(CATEGORIES.TASKS.TYPES.TASK)))).length).toBe(5)
        await db.stop()

        db = new DataBase()
        db.set_changes_dir(temp_dir)
        await db.load_json("test/resources/db.tasks.json")
        await db.start()
        expect(db.QUERY((AND(IS_TYPE(CATEGORIES.TASKS.TYPES.TASK)))).length).toBe(5)
        await db.add_object({
            "category": "CATEGORIES.TASKS.ID",
            "type": "CATEGORIES.TASKS.TYPES.TASK",
            "props": {
                "title": "another task task",
                "project": 6,
                "completed": true,
                "archived": false,
                "deleted": false
            }
        })
        expect(db.QUERY((AND(IS_TYPE(CATEGORIES.TASKS.TYPES.TASK)))).length).toBe(6)
        await db.stop()

        db = new DataBase()
        db.set_changes_dir(temp_dir)
        await db.load_json("test/resources/db.tasks.json")
        await db.start()
        expect(db.QUERY((AND(IS_TYPE(CATEGORIES.TASKS.TYPES.TASK)))).length).toBe(6)
        await db.stop()

        await fs.rm(temp_dir,{recursive:true})
    })
})


// class ListPanel extends Component {
//     constructor(opts) {
//         super(opts);
//         this.name = 'list-panel'
//         this.list = null
//         this.debug_draw_event = opts.debug_draw_event
//     }
//     layout() {
//         if(!this.list) {
//             this.list = []
//             this.window().app.on("database-query-response",(t) => {
//                 // console.log("got the database response",t.payload.docs.length)
//                 this.list = t.payload.docs
//                 this.repaint(t)
//                 if(this.debug_draw_event) this.window().send({
//                     type:"debug-action-done",
//                     count:t.payload.docs.length
//                 })
//             })
//             this.window().send({
//                 type:"database-query",
//                 query: {
//                     and: [
//                         {
//                             TYPE: CATEGORIES.CHAT.TYPES.MESSAGE
//
//                         },
//                         {
//                             CATEGORY: CATEGORIES.CHAT.ID
//                         }
//                     ]
//                 }
//             })
//         } else {
//             this.height = this.list.length*10
//         }
//     }
//     redraw(gfx) {
//         console.log("drawing self with list",this.list,this.height)
//     }
// }
//
// describe("db driven app test", () => {
//     it('will open an app', async () => {
//
//         let server = new CentralServer({
//             hostname:'127.0.0.1',
//             websocket_port:8081,
//             apps:{ system:[], user:[] }
//         })
//
//         try {
//             await server.start()
//             await server.db.watch_json("test/resources/db.chats.json")
//             let display = new HeadlessDisplay(server.hostname, server.websocket_port)
//             await display.wait_for_message(GENERAL.TYPE_Connected)
//             await display.send(GENERAL.MAKE_ScreenStart())
//
//             //create app
//             let app = await start_testguiapp(server, async (wrapper) => {
//                 // open window
//                 let main_window = await wrapper.app.open_window(0, 0, 100, 120, 'plain')
//
//                 //add listpanel control with query
//                 main_window.root = new ListPanel({query:"foo",debug_draw_event:true})
//                 main_window.redraw()
//             })
//
//             //wait for debug message
//             let done_msg = await app.wait_for_message("debug-action-done")
//             //should have 4 results
//             assert.strictEqual(done_msg.count,4)
//
//             await server.shutdown()
//             console.log('everything should be shut down now')
//         } catch (e) {
//             console.log(e)
//             await server.shutdown()
//         }
//     })
//
// })
