const TYPE_ListAppsRequest = "MAKE_ListAppsRequest_name"
function MAKE_ListAppsRequest(data) {
    let obj = {}
    obj.type = TYPE_ListAppsRequest
    return obj
}
const TYPE_ListAppsResponse = "MAKE_ListAppsResponse_name"
function MAKE_ListAppsResponse(data) {
    let obj = {}
    obj.type = TYPE_ListAppsResponse
    if(!data.hasOwnProperty('connection_count')) throw new Error("object 'ListAppsResponse' is missing property 'connection_count' ")
    if(data.connection_count === undefined) throw new Error("object 'ListAppsResponse has undefined property connection_count")
    obj.connection_count = data.connection_count
    
    if(!data.hasOwnProperty('apps')) throw new Error("object 'ListAppsResponse' is missing property 'apps' ")
    if(data.apps === undefined) throw new Error("object 'ListAppsResponse has undefined property apps")
    obj.apps = MAKE_apps_list(data.apps)
    
    return obj
}
const TYPE_apps_list = "MAKE_apps_list_name"
export function MAKE_apps_list(arr) {
    return arr
}
const TYPE_app_info = "MAKE_app_info_name"
function MAKE_app_info(data) {
    let obj = {}
    obj.type = TYPE_app_info
    if(!data.hasOwnProperty('id')) throw new Error("object 'app_info' is missing property 'id' ")
    if(data.id === undefined) throw new Error("object 'app_info has undefined property id")
    obj.id = data.id
    
    if(!data.hasOwnProperty('name')) throw new Error("object 'app_info' is missing property 'name' ")
    if(data.name === undefined) throw new Error("object 'app_info has undefined property name")
    obj.name = data.name
    
    if(!data.hasOwnProperty('path')) throw new Error("object 'app_info' is missing property 'path' ")
    if(data.path === undefined) throw new Error("object 'app_info has undefined property path")
    obj.path = data.path
    
    if(!data.hasOwnProperty('args')) throw new Error("object 'app_info' is missing property 'args' ")
    if(data.args === undefined) throw new Error("object 'app_info has undefined property args")
    obj.args = data.args
    
    return obj
}
const TYPE_TestStart = "MAKE_TestStart_name"
function MAKE_TestStart(data) {
    let obj = {}
    obj.type = TYPE_TestStart
    if(!data.hasOwnProperty('sender')) throw new Error("object 'TestStart' is missing property 'sender' ")
    if(data.sender === undefined) throw new Error("object 'TestStart has undefined property sender")
    obj.sender = data.sender
    
    return obj
}
const TYPE_StartApp = "MAKE_StartApp_name"
function MAKE_StartApp(data) {
    let obj = {}
    obj.type = TYPE_StartApp
    if(!data.hasOwnProperty('target')) throw new Error("object 'StartApp' is missing property 'target' ")
    if(data.target === undefined) throw new Error("object 'StartApp has undefined property target")
    obj.target = data.target
    
    return obj
}
const TYPE_StopApp = "MAKE_StopApp_name"
function MAKE_StopApp(data) {
    let obj = {}
    obj.type = TYPE_StopApp
    if(!data.hasOwnProperty('target')) throw new Error("object 'StopApp' is missing property 'target' ")
    if(data.target === undefined) throw new Error("object 'StopApp has undefined property target")
    obj.target = data.target
    
    return obj
}
const TYPE_RestartApp = "MAKE_RestartApp_name"
function MAKE_RestartApp(data) {
    let obj = {}
    obj.type = TYPE_RestartApp
    if(!data.hasOwnProperty('target')) throw new Error("object 'RestartApp' is missing property 'target' ")
    if(data.target === undefined) throw new Error("object 'RestartApp has undefined property target")
    obj.target = data.target
    
    return obj
}
export const DEBUG = {
    MAKE_ListAppsRequest : MAKE_ListAppsRequest,
    TYPE_ListAppsRequest : TYPE_ListAppsRequest,
    MAKE_ListAppsResponse : MAKE_ListAppsResponse,
    TYPE_ListAppsResponse : TYPE_ListAppsResponse,
    MAKE_apps_list : MAKE_apps_list,
    TYPE_apps_list : TYPE_apps_list,
    MAKE_app_info : MAKE_app_info,
    TYPE_app_info : TYPE_app_info,
    MAKE_TestStart : MAKE_TestStart,
    TYPE_TestStart : TYPE_TestStart,
    MAKE_StartApp : MAKE_StartApp,
    TYPE_StartApp : TYPE_StartApp,
    MAKE_StopApp : MAKE_StopApp,
    TYPE_StopApp : TYPE_StopApp,
    MAKE_RestartApp : MAKE_RestartApp,
    TYPE_RestartApp : TYPE_RestartApp,
}