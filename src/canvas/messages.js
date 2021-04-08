export const OPEN_WINDOW = {
    NAME:'OPEN_WINDOW',
    RESPONSE_NAME: 'WINDOW_OPENED',
    SCREEN_NAME: 'SCREEN_NAME',
    CLOSED:'WINDOW_CLOSED',
}
export const DRAWING = {
    REFRESH_WINDOW:'REFRESH_WINDOW'
}
export const DRAW_PIXEL = {
    NAME:'DRAW_PIXEL'
}
// export const FILL_RECT = {
//     NAME:'FILL_RECT',
// }
export const HEARTBEAT = {
    NAME:'HEARTBEAT'
}
export const MOUSE = {
    DOWN:{
        NAME:'MOUSE_DOWN'
    },
    UP: {
        NAME:'MOUSE_UP'
    }
}

export const SCREEN = {
    START:'START',
    SCREEN:'SCREEN',
    WINDOW_LIST:'WINDOW_LIST',
}


let schemas = {
    DRAW:{
        PIXEL:['color','x','y'],
        RECT:['color','x','y','width','height']
    }
}

function process_schema(sch) {
    let obj = {}
    Object.keys(sch).map(key => {
        let sub = sch[key]
        let sobj = {}
        Object.entries(sub).map(([sk,v])=>{
            console.log("sk",sk,v)
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
    if(msg.type === sch.NAME) return true
    return false
}

export function make_message(sch,opts) {
    console.log("making message for schema",sch)
    let msg = {
        type:sch.NAME
    }
    sch.props.forEach(key => {
        if(!opts.hasOwnProperty(key)) throw new Error(`message missing option ${key}`)
    })
    Object.entries(opts).forEach(([key,value])=>{
        msg[key] = value
    })

    return msg
}

export const DEBUG = {
    LIST:'DEBUG_LIST',
    CLIENT:'DEBUG_CLIENT',
    LISTS_RESPONSE:'DEBUG_LIST_RESPONSE',
    RESTART_APP_REQUEST:'RESTART_APP_REQUEST',
    LOG:'DEBUG_LOG',
}