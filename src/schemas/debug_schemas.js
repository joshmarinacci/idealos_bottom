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
    obj.connection_count = data.connection_count
    
    if(!data.hasOwnProperty('apps')) throw new Error("object 'ListAppsResponse' is missing property 'apps' ")
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
    obj.id = data.id
    
    if(!data.hasOwnProperty('name')) throw new Error("object 'app_info' is missing property 'name' ")
    obj.name = data.name
    
    if(!data.hasOwnProperty('path')) throw new Error("object 'app_info' is missing property 'path' ")
    obj.path = data.path
    
    if(!data.hasOwnProperty('args')) throw new Error("object 'app_info' is missing property 'args' ")
    obj.args = data.args
    
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
}