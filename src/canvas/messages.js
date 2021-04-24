
let schemas = {
    GENERAL:{
        CONNECTED:[],
        HEARTBEAT:[],
    },
    SCREEN:{
        START:[],
        // WINDOW_LIST:['windows']
    },
    // WINDOW:{
        // OPEN:['width','height','sender','window_type'],
        //OPEN_SCREEN:['target','window'],
        // OPEN_RESPONSE:['target','window'],
        // CLOSE:['target','window'],
        // REFRESH:[],
    // },
    DRAW:{
        PIXEL:['color','x','y'],
        RECT:['color','x','y','width','height'],
        IMAGE:['x','y','width','height','pixels'],
    },
    MOUSE:{
        UP:[],
        DOWN:[],
    },
    KEYBOARD: {
        UP:[],
        DOWN:[],
    },
    DEBUG:{
        LIST:[],
        LIST_RESPONSE:['connection_count','apps'],
        CLIENT:[],
        LOG:['data'],
        RESTART_APP:['target'],
        STOP_APP:['target'],
        START_APP:['target'],
    },
    TEST:{
        START:['sender']
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