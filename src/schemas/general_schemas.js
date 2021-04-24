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
export const GENERAL = {
    MAKE_Heartbeat : MAKE_Heartbeat,
    TYPE_Heartbeat : TYPE_Heartbeat,
    MAKE_ScreenStart : MAKE_ScreenStart,
    TYPE_ScreenStart : TYPE_ScreenStart,
    MAKE_Connected : MAKE_Connected,
    TYPE_Connected : TYPE_Connected,
}