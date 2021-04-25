const TYPE_Heartbeat = "MAKE_Heartbeat_name"
function MAKE_Heartbeat(data) {
    let obj = {}
    obj.type = TYPE_Heartbeat
    return obj
}
const TYPE_ScreenStart = "MAKE_ScreenStart_name"
function MAKE_ScreenStart(data) {
    let obj = {}
    obj.type = TYPE_ScreenStart
    return obj
}
const TYPE_Connected = "MAKE_Connected_name"
function MAKE_Connected(data) {
    let obj = {}
    obj.type = TYPE_Connected
    return obj
}
const TYPE_log_data = "MAKE_log_data_name"
export function MAKE_log_data(arr) {
    return arr
}
const TYPE_Log = "MAKE_Log_name"
function MAKE_Log(data) {
    let obj = {}
    obj.type = TYPE_Log
    if(!data.hasOwnProperty('data')) throw new Error("object 'Log' is missing property 'data' ")
    if(data.data === undefined) throw new Error("object 'Log has undefined property data")
    obj.data = MAKE_log_data(data.data)
    
    return obj
}
export const GENERAL = {
    MAKE_Heartbeat : MAKE_Heartbeat,
    TYPE_Heartbeat : TYPE_Heartbeat,
    MAKE_ScreenStart : MAKE_ScreenStart,
    TYPE_ScreenStart : TYPE_ScreenStart,
    MAKE_Connected : MAKE_Connected,
    TYPE_Connected : TYPE_Connected,
    MAKE_log_data : MAKE_log_data,
    TYPE_log_data : TYPE_log_data,
    MAKE_Log : MAKE_Log,
    TYPE_Log : TYPE_Log,
}