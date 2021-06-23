import {CATEGORIES} from "../src/server/db/schema.js"
import {makeDB, makeDB_with_json_files, sort} from '../src/server/db/db.js'
import {compareAsc} from "date-fns"
import expect from "expect"
import {DATA} from './resources/db.test.data.js'


describe("db tests",() => {
    let db = makeDB(DATA)

    it('will find all chat messages', async () => {
        let db = await makeDB_with_json_files([
            "test/resources/db.chats.json",
            "test/resources/db.tasks.json"
        ])
        //find all chat messages
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
    })
    it('find all items where first or last contains the substring "mar"', () => {
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
    })

    //compound AND and OR query
    it('find all contacts.people where first or last contains the substring "Mar"', () => {
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
    it('archived notes', () => {
        const and = (...args) => ({and: args})
        const isNote = () => ({TYPE: CATEGORIES.NOTES.TYPES.NOTE})
        const isArchived = () => ({equal: {prop: 'archived', value: true}})

        const res = db.QUERY(and(isNote(), isArchived()))
        expect(res.length).toBe(2)
    })


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
    })

})
