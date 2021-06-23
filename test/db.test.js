import {CATEGORIES} from "../src/server/db/schema.js"
import {DataBase} from '../src/server/db/db.js'
import expect from "expect"
import {AND, IS_PROP_TRUE, IS_TYPE} from '../src/server/db/query.js'


describe("db tests",() => {

    it('will find all chat messages', async () => {
        let db = new DataBase()
        await db.watch_json("test/resources/db.chats.json")
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
        // assert.strictEqual(res.length, 4)
        expect(res.length).toBe(4)
        await db.stop()
    })

    it('find all items where first or last contains the substring "mar"', async () => {
        let db = new DataBase()
        await db.watch_json("test/resources/db.contacts.json")
        await db.start()
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
        await db.watch_json("test/resources/db.chats.json")
        await db.watch_json("test/resources/db.json_broken.json")
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
        // assert.strictEqual(res.length, 4)
        expect(res.length).toBe(4)
        await db.stop()
    })

    it("don't let invalid data in", async () => {
        let db = new DataBase()
        await db.watch_json("test/resources/db.schema_broken.json")
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


    //compound AND and OR query
    it('find all contacts.people where first or last contains the substring "Mar"', async () => {
        let db = new DataBase()
        await db.watch_json("test/resources/db.contacts.json")
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
    })

    /*
    it('query building', () => {

        const and = (...args) => ({and: args})
        const or = (...args) => ({or: args})
        const hasSubstring = (f, value) => ({substring: {prop: f, value: value}})

        const res = query(DATA, and(isPerson(), isContact(), or(
            hasSubstring('last', 'mar'),
            hasSubstring('first', 'mar')
        )))

        expect(res.length).toBe(2)
    })
    */


    //find all notes where archived is true
    it('archived tasks', async () => {
        let db = new DataBase()
        await db.watch_json("test/resources/db.tasks.json")
        await db.start()
        const res = db.QUERY(AND(
            IS_TYPE(CATEGORIES.TASKS.TYPES.TASK),
            IS_PROP_TRUE("archived"),
        ))
        expect(res.length).toBe(1)
        await db.stop()
    })

    /*
    it('sort by date', () => {
        const and = (...args) => ({and: args})
        const isEmail = () => ({TYPE: CATEGORIES.EMAIL.TYPES.MESSAGE})
        const isMessage = () => ({CATEGORY: CATEGORIES.EMAIL.ID})

        let res1 = db.QUERY(and(isMessage(), isEmail()))
        res1 = sort(res1, ["timestamp"])
        let res2 = res1.slice()
        res2.sort((a, b) => compareAsc(a.props.timestamp, b.props.timestamp))
        console.log("res2", res2.map(o => o.props.timestamp))
        expect(res1.length).toBe(4)
        expect(res1).toEqual(res2)
    })

    function encode_props_with_types(value) {
        let props = {}
        Object.keys(value).forEach(k => {
            let prefix = ''
            let val = value[k]
            if (value[k] instanceof Date) {
                prefix = '_date_'
                val = val.toISOString()
            }
            props[prefix + k] = val
        })
        return props
    }

    function decode_props_with_types(value) {
        let props = {}
        Object.keys(value).forEach(k => {
            if (k.startsWith('_date_')) {
                let k2 = k.replace('_date_', '')
                props[k2] = new Date(value[k])
            } else {
                props[k] = value[k]
            }
        })
        return props
    }

    it('date encoding test', () => {
        let obj1 = {
            props: {
                time: new Date()
            }
        }

        console.log("obj1", obj1)
        expect(typeof obj1.props.time).toBe('object')

        let str = JSON.stringify(obj1, function (key, value) {
            if (key === 'props') return encode_props_with_types(value)
            return value
        })
        console.log('JSON string is', str)
        let obj2 = JSON.parse(str, function (key, value) {
            if (key === 'props') return decode_props_with_types(value);
            return value
        })
        console.log('obj2', obj2)
        expect(obj2.props.time instanceof Date).toBe(true)
        expect(obj2.props.time.toISOString()).toBe(obj1.props.time.toISOString())
    })*/

})
