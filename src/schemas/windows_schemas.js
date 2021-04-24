const TYPE_window_info = "MAKE_window_info_name"
function MAKE_window_info(data) {
    let obj = {}
    obj.type = TYPE_window_info
    if(!data.hasOwnProperty('id')) throw new Error("object 'window_info' is missing property 'id' ")
    obj.id = data.id
    
    if(!data.hasOwnProperty('width')) throw new Error("object 'window_info' is missing property 'width' ")
    obj.width = data.width
    
    if(!data.hasOwnProperty('height')) throw new Error("object 'window_info' is missing property 'height' ")
    obj.height = data.height
    
    if(!data.hasOwnProperty('x')) throw new Error("object 'window_info' is missing property 'x' ")
    obj.x = data.x
    
    if(!data.hasOwnProperty('y')) throw new Error("object 'window_info' is missing property 'y' ")
    obj.y = data.y
    
    if(!data.hasOwnProperty('owner')) throw new Error("object 'window_info' is missing property 'owner' ")
    obj.owner = data.owner
    
    if(!data.hasOwnProperty('window_type')) throw new Error("object 'window_info' is missing property 'window_type' ")
    obj.window_type = data.window_type
    
    return obj
}
const TYPE_window_array = "MAKE_window_array_name"
export function MAKE_window_array(arr) {
    return arr
}
const TYPE_window_map = "MAKE_window_map_name"
export function MAKE_window_map(map) {
    return map
}
const TYPE_WindowOpen = "MAKE_WindowOpen_name"
function MAKE_WindowOpen(data) {
    let obj = {}
    obj.type = TYPE_WindowOpen
    if(!data.hasOwnProperty('width')) throw new Error("object 'WindowOpen' is missing property 'width' ")
    obj.width = data.width
    
    if(!data.hasOwnProperty('height')) throw new Error("object 'WindowOpen' is missing property 'height' ")
    obj.height = data.height
    
    if(!data.hasOwnProperty('sender')) throw new Error("object 'WindowOpen' is missing property 'sender' ")
    obj.sender = data.sender
    
    if(!data.hasOwnProperty('window_type')) throw new Error("object 'WindowOpen' is missing property 'window_type' ")
    obj.window_type = data.window_type
    
    return obj
}
const TYPE_WindowOpenDisplay = "MAKE_WindowOpenDisplay_name"
function MAKE_WindowOpenDisplay(data) {
    let obj = {}
    obj.type = TYPE_WindowOpenDisplay
    if(!data.hasOwnProperty('target')) throw new Error("object 'WindowOpenDisplay' is missing property 'target' ")
    obj.target = data.target
    
    if(!data.hasOwnProperty('window')) throw new Error("object 'WindowOpenDisplay' is missing property 'window' ")
    obj.window = MAKE_window_info(data.window)
    
    return obj
}
const TYPE_WindowOpenResponse = "MAKE_WindowOpenResponse_name"
function MAKE_WindowOpenResponse(data) {
    let obj = {}
    obj.type = TYPE_WindowOpenResponse
    if(!data.hasOwnProperty('target')) throw new Error("object 'WindowOpenResponse' is missing property 'target' ")
    obj.target = data.target
    
    if(!data.hasOwnProperty('window')) throw new Error("object 'WindowOpenResponse' is missing property 'window' ")
    obj.window = data.window
    
    return obj
}
const TYPE_window_close = "MAKE_window_close_name"
function MAKE_window_close(data) {
    let obj = {}
    obj.type = TYPE_window_close
    if(!data.hasOwnProperty('target')) throw new Error("object 'window_close' is missing property 'target' ")
    obj.target = data.target
    
    if(!data.hasOwnProperty('window')) throw new Error("object 'window_close' is missing property 'window' ")
    obj.window = data.window
    
    return obj
}
const TYPE_window_list = "MAKE_window_list_name"
function MAKE_window_list(data) {
    let obj = {}
    obj.type = TYPE_window_list
    if(!data.hasOwnProperty('windows')) throw new Error("object 'window_list' is missing property 'windows' ")
    obj.windows = MAKE_window_map(data.windows)
    
    return obj
}
const TYPE_window_refresh_request = "MAKE_window_refresh_request_name"
function MAKE_window_refresh_request(data) {
    let obj = {}
    obj.type = TYPE_window_refresh_request
    if(!data.hasOwnProperty('type')) throw new Error("object 'window_refresh_request' is missing property 'type' ")
    obj.type = data.type
    
    if(!data.hasOwnProperty('target')) throw new Error("object 'window_refresh_request' is missing property 'target' ")
    obj.target = data.target
    
    if(!data.hasOwnProperty('window')) throw new Error("object 'window_refresh_request' is missing property 'window' ")
    obj.window = data.window
    
    return obj
}
const TYPE_window_refresh_response = "MAKE_window_refresh_response_name"
function MAKE_window_refresh_response(data) {
    let obj = {}
    obj.type = TYPE_window_refresh_response
    return obj
}
const TYPE_create_child_window = "MAKE_create_child_window_name"
function MAKE_create_child_window(data) {
    let obj = {}
    obj.type = TYPE_create_child_window
    if(!data.hasOwnProperty('parent')) throw new Error("object 'create_child_window' is missing property 'parent' ")
    obj.parent = data.parent
    
    if(!data.hasOwnProperty('x')) throw new Error("object 'create_child_window' is missing property 'x' ")
    obj.x = data.x
    
    if(!data.hasOwnProperty('y')) throw new Error("object 'create_child_window' is missing property 'y' ")
    obj.y = data.y
    
    if(!data.hasOwnProperty('width')) throw new Error("object 'create_child_window' is missing property 'width' ")
    obj.width = data.width
    
    if(!data.hasOwnProperty('height')) throw new Error("object 'create_child_window' is missing property 'height' ")
    obj.height = data.height
    
    if(!data.hasOwnProperty('style')) throw new Error("object 'create_child_window' is missing property 'style' ")
    obj.style = data.style
    
    if(!data.hasOwnProperty('sender')) throw new Error("object 'create_child_window' is missing property 'sender' ")
    obj.sender = data.sender
    
    return obj
}
const TYPE_create_child_window_response = "MAKE_create_child_window_response_name"
function MAKE_create_child_window_response(data) {
    let obj = {}
    obj.type = TYPE_create_child_window_response
    if(!data.hasOwnProperty('sender')) throw new Error("object 'create_child_window_response' is missing property 'sender' ")
    obj.sender = data.sender
    
    if(!data.hasOwnProperty('target')) throw new Error("object 'create_child_window_response' is missing property 'target' ")
    obj.target = data.target
    
    if(!data.hasOwnProperty('parent')) throw new Error("object 'create_child_window_response' is missing property 'parent' ")
    obj.parent = data.parent
    
    if(!data.hasOwnProperty('window')) throw new Error("object 'create_child_window_response' is missing property 'window' ")
    obj.window = data.window
    
    return obj
}
const TYPE_create_child_window_display = "MAKE_create_child_window_display_name"
function MAKE_create_child_window_display(data) {
    let obj = {}
    obj.type = TYPE_create_child_window_display
    if(!data.hasOwnProperty('parent')) throw new Error("object 'create_child_window_display' is missing property 'parent' ")
    obj.parent = data.parent
    
    if(!data.hasOwnProperty('window')) throw new Error("object 'create_child_window_display' is missing property 'window' ")
    obj.window = MAKE_window_info(data.window)
    
    if(!data.hasOwnProperty('sender')) throw new Error("object 'create_child_window_display' is missing property 'sender' ")
    obj.sender = data.sender
    
    return obj
}
const TYPE_close_child_window = "MAKE_close_child_window_name"
function MAKE_close_child_window(data) {
    let obj = {}
    obj.type = TYPE_close_child_window
    if(!data.hasOwnProperty('parent')) throw new Error("object 'close_child_window' is missing property 'parent' ")
    obj.parent = data.parent
    
    if(!data.hasOwnProperty('sender')) throw new Error("object 'close_child_window' is missing property 'sender' ")
    obj.sender = data.sender
    
    if(!data.hasOwnProperty('id')) throw new Error("object 'close_child_window' is missing property 'id' ")
    obj.id = data.id
    
    return obj
}
const TYPE_close_child_window_response = "MAKE_close_child_window_response_name"
function MAKE_close_child_window_response(data) {
    let obj = {}
    obj.type = TYPE_close_child_window_response
    if(!data.hasOwnProperty('sender')) throw new Error("object 'close_child_window_response' is missing property 'sender' ")
    obj.sender = data.sender
    
    if(!data.hasOwnProperty('target')) throw new Error("object 'close_child_window_response' is missing property 'target' ")
    obj.target = data.target
    
    if(!data.hasOwnProperty('parent')) throw new Error("object 'close_child_window_response' is missing property 'parent' ")
    obj.parent = data.parent
    
    if(!data.hasOwnProperty('window')) throw new Error("object 'close_child_window_response' is missing property 'window' ")
    obj.window = data.window
    
    return obj
}
const TYPE_close_child_window_display = "MAKE_close_child_window_display_name"
function MAKE_close_child_window_display(data) {
    let obj = {}
    obj.type = TYPE_close_child_window_display
    if(!data.hasOwnProperty('parent')) throw new Error("object 'close_child_window_display' is missing property 'parent' ")
    obj.parent = data.parent
    
    if(!data.hasOwnProperty('window')) throw new Error("object 'close_child_window_display' is missing property 'window' ")
    obj.window = data.window
    
    if(!data.hasOwnProperty('sender')) throw new Error("object 'close_child_window_display' is missing property 'sender' ")
    obj.sender = data.sender
    
    return obj
}
export const WINDOWS = {
    MAKE_window_info : MAKE_window_info,
    TYPE_window_info : TYPE_window_info,
    MAKE_window_array : MAKE_window_array,
    TYPE_window_array : TYPE_window_array,
    MAKE_window_map : MAKE_window_map,
    TYPE_window_map : TYPE_window_map,
    MAKE_WindowOpen : MAKE_WindowOpen,
    TYPE_WindowOpen : TYPE_WindowOpen,
    MAKE_WindowOpenDisplay : MAKE_WindowOpenDisplay,
    TYPE_WindowOpenDisplay : TYPE_WindowOpenDisplay,
    MAKE_WindowOpenResponse : MAKE_WindowOpenResponse,
    TYPE_WindowOpenResponse : TYPE_WindowOpenResponse,
    MAKE_window_close : MAKE_window_close,
    TYPE_window_close : TYPE_window_close,
    MAKE_window_list : MAKE_window_list,
    TYPE_window_list : TYPE_window_list,
    MAKE_window_refresh_request : MAKE_window_refresh_request,
    TYPE_window_refresh_request : TYPE_window_refresh_request,
    MAKE_window_refresh_response : MAKE_window_refresh_response,
    TYPE_window_refresh_response : TYPE_window_refresh_response,
    MAKE_create_child_window : MAKE_create_child_window,
    TYPE_create_child_window : TYPE_create_child_window,
    MAKE_create_child_window_response : MAKE_create_child_window_response,
    TYPE_create_child_window_response : TYPE_create_child_window_response,
    MAKE_create_child_window_display : MAKE_create_child_window_display,
    TYPE_create_child_window_display : TYPE_create_child_window_display,
    MAKE_close_child_window : MAKE_close_child_window,
    TYPE_close_child_window : TYPE_close_child_window,
    MAKE_close_child_window_response : MAKE_close_child_window_response,
    TYPE_close_child_window_response : TYPE_close_child_window_response,
    MAKE_close_child_window_display : MAKE_close_child_window_display,
    TYPE_close_child_window_display : TYPE_close_child_window_display,
}