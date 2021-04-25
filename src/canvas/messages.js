
let schemas = {
    DEBUG:{
        CLIENT:[],
        // LOG:['data'],
    },
}

function process_schema(sch) {
    let obj = {}
    Object.keys(sch).map(key => {
        let sub = sch[key]
        let sobj = {}
        Object.entries(sub).map(([sk,v])=>{
            sobj[sk] = {
                NAME:`${key}_${sk}`,
                props:v,
            }
        })
        obj[key] = sobj
    })
    return obj
}

export const SCHEMAS = process_schema(schemas)

export function message_match(sch,msg) {
    if(!msg || !msg.type) return false
    if(!sch) throw new Error(`no such schema for message type ${msg.type}`)
    if(msg.type === sch.NAME) return true
    return false
}

export function make_message(sch,opts) {
    let msg = {
        type:sch.NAME
    }
    sch.props.forEach(key => {
        if(!opts.hasOwnProperty(key)) throw new Error(`message missing option ${key}`)
        if(typeof opts[key] === 'undefined') throw new Error(`message key ${key} = undefined!`)
    })
    Object.keys(opts).forEach(key => {
        if(sch.props.indexOf(key) < 0) throw new Error(`message has extra key '${key}' compared to ${JSON.stringify(sch)}`)
    })
    Object.entries(opts).forEach(([key,value])=>{
        msg[key] = value
    })

    // console.log("made message",msg)
    return msg
}