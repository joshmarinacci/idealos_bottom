const MAKE_window_info_name = "MAKE_window_info_name"
function MAKE_window_info(data) {
    let obj = {}
    obj.type = MAKE_window_info_name
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
const MAKE_window_array_name = "MAKE_window_array_name"
export function MAKE_window_array(arr) {
    return arr
}
const MAKE_window_map_name = "MAKE_window_map_name"
export function MAKE_window_map(map) {
    return map
}
const MAKE_window_open_name = "MAKE_window_open_name"
function MAKE_window_open(data) {
    let obj = {}
    obj.type = MAKE_window_open_name
    if(!data.hasOwnProperty('width')) throw new Error("object 'window_open' is missing property 'width' ")
    obj.width = data.width
    
    if(!data.hasOwnProperty('height')) throw new Error("object 'window_open' is missing property 'height' ")
    obj.height = data.height
    
    if(!data.hasOwnProperty('sender')) throw new Error("object 'window_open' is missing property 'sender' ")
    obj.sender = data.sender
    
    if(!data.hasOwnProperty('window_type')) throw new Error("object 'window_open' is missing property 'window_type' ")
    obj.window_type = data.window_type
    
    return obj
}
const MAKE_window_open_display_name = "MAKE_window_open_display_name"
function MAKE_window_open_display(data) {
    let obj = {}
    obj.type = MAKE_window_open_display_name
    if(!data.hasOwnProperty('target')) throw new Error("object 'window_open_display' is missing property 'target' ")
    obj.target = data.target
    
    if(!data.hasOwnProperty('window')) throw new Error("object 'window_open_display' is missing property 'window' ")
    obj.window = MAKE_window_info(data.window)
    
    return obj
}
const MAKE_window_open_response_name = "MAKE_window_open_response_name"
function MAKE_window_open_response(data) {
    let obj = {}
    obj.type = MAKE_window_open_response_name
    if(!data.hasOwnProperty('target')) throw new Error("object 'window_open_response' is missing property 'target' ")
    obj.target = data.target
    
    if(!data.hasOwnProperty('window')) throw new Error("object 'window_open_response' is missing property 'window' ")
    obj.window = data.window
    
    return obj
}
const MAKE_window_close_name = "MAKE_window_close_name"
function MAKE_window_close(data) {
    let obj = {}
    obj.type = MAKE_window_close_name
    if(!data.hasOwnProperty('target')) throw new Error("object 'window_close' is missing property 'target' ")
    obj.target = data.target
    
    if(!data.hasOwnProperty('window')) throw new Error("object 'window_close' is missing property 'window' ")
    obj.window = data.window
    
    return obj
}
const MAKE_window_list_name = "MAKE_window_list_name"
function MAKE_window_list(data) {
    let obj = {}
    obj.type = MAKE_window_list_name
    if(!data.hasOwnProperty('windows')) throw new Error("object 'window_list' is missing property 'windows' ")
    obj.windows = MAKE_window_map(data.windows)
    
    return obj
}
const MAKE_window_refresh_request_name = "MAKE_window_refresh_request_name"
function MAKE_window_refresh_request(data) {
    let obj = {}
    obj.type = MAKE_window_refresh_request_name
    if(!data.hasOwnProperty('type')) throw new Error("object 'window_refresh_request' is missing property 'type' ")
    obj.type = data.type
    
    if(!data.hasOwnProperty('target')) throw new Error("object 'window_refresh_request' is missing property 'target' ")
    obj.target = data.target
    
    if(!data.hasOwnProperty('window')) throw new Error("object 'window_refresh_request' is missing property 'window' ")
    obj.window = data.window
    
    return obj
}
const MAKE_window_refresh_response_name = "MAKE_window_refresh_response_name"
function MAKE_window_refresh_response(data) {
    let obj = {}
    obj.type = MAKE_window_refresh_response_name
    return obj
}
const MAKE_create_child_window_name = "MAKE_create_child_window_name"
function MAKE_create_child_window(data) {
    let obj = {}
    obj.type = MAKE_create_child_window_name
    if(!data.hasOwnProperty('type')) throw new Error("object 'create_child_window' is missing property 'type' ")
    obj.type = data.type
    
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
const MAKE_create_child_window_response_name = "MAKE_create_child_window_response_name"
function MAKE_create_child_window_response(data) {
    let obj = {}
    obj.type = MAKE_create_child_window_response_name
    if(!data.hasOwnProperty('type')) throw new Error("object 'create_child_window_response' is missing property 'type' ")
    obj.type = data.type
    
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
const MAKE_create_child_window_display_name = "MAKE_create_child_window_display_name"
function MAKE_create_child_window_display(data) {
    let obj = {}
    obj.type = MAKE_create_child_window_display_name
    if(!data.hasOwnProperty('type')) throw new Error("object 'create_child_window_display' is missing property 'type' ")
    obj.type = data.type
    
    if(!data.hasOwnProperty('parent')) throw new Error("object 'create_child_window_display' is missing property 'parent' ")
    obj.parent = data.parent
    
    if(!data.hasOwnProperty('window')) throw new Error("object 'create_child_window_display' is missing property 'window' ")
    obj.window = MAKE_window_info(data.window)
    
    if(!data.hasOwnProperty('sender')) throw new Error("object 'create_child_window_display' is missing property 'sender' ")
    obj.sender = data.sender
    
    return obj
}
const MAKE_close_child_window_name = "MAKE_close_child_window_name"
function MAKE_close_child_window(data) {
    let obj = {}
    obj.type = MAKE_close_child_window_name
    if(!data.hasOwnProperty('type')) throw new Error("object 'close_child_window' is missing property 'type' ")
    obj.type = data.type
    
    if(!data.hasOwnProperty('parent')) throw new Error("object 'close_child_window' is missing property 'parent' ")
    obj.parent = data.parent
    
    if(!data.hasOwnProperty('sender')) throw new Error("object 'close_child_window' is missing property 'sender' ")
    obj.sender = data.sender
    
    if(!data.hasOwnProperty('id')) throw new Error("object 'close_child_window' is missing property 'id' ")
    obj.id = data.id
    
    return obj
}
const MAKE_close_child_window_response_name = "MAKE_close_child_window_response_name"
function MAKE_close_child_window_response(data) {
    let obj = {}
    obj.type = MAKE_close_child_window_response_name
    if(!data.hasOwnProperty('type')) throw new Error("object 'close_child_window_response' is missing property 'type' ")
    obj.type = data.type
    
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
const MAKE_close_child_window_display_name = "MAKE_close_child_window_display_name"
function MAKE_close_child_window_display(data) {
    let obj = {}
    obj.type = MAKE_close_child_window_display_name
    if(!data.hasOwnProperty('type')) throw new Error("object 'close_child_window_display' is missing property 'type' ")
    obj.type = data.type
    
    if(!data.hasOwnProperty('parent')) throw new Error("object 'close_child_window_display' is missing property 'parent' ")
    obj.parent = data.parent
    
    if(!data.hasOwnProperty('window')) throw new Error("object 'close_child_window_display' is missing property 'window' ")
    obj.window = data.window
    
    if(!data.hasOwnProperty('sender')) throw new Error("object 'close_child_window_display' is missing property 'sender' ")
    obj.sender = data.sender
    
    return obj
}
export const MENUS = {
    MAKE_window_info : MAKE_window_info,
    MAKE_window_info_name : MAKE_window_info_name,
    MAKE_window_array : MAKE_window_array,
    MAKE_window_array_name : MAKE_window_array_name,
    MAKE_window_map : MAKE_window_map,
    MAKE_window_map_name : MAKE_window_map_name,
    MAKE_window_open : MAKE_window_open,
    MAKE_window_open_name : MAKE_window_open_name,
    MAKE_window_open_display : MAKE_window_open_display,
    MAKE_window_open_display_name : MAKE_window_open_display_name,
    MAKE_window_open_response : MAKE_window_open_response,
    MAKE_window_open_response_name : MAKE_window_open_response_name,
    MAKE_window_close : MAKE_window_close,
    MAKE_window_close_name : MAKE_window_close_name,
    MAKE_window_list : MAKE_window_list,
    MAKE_window_list_name : MAKE_window_list_name,
    MAKE_window_refresh_request : MAKE_window_refresh_request,
    MAKE_window_refresh_request_name : MAKE_window_refresh_request_name,
    MAKE_window_refresh_response : MAKE_window_refresh_response,
    MAKE_window_refresh_response_name : MAKE_window_refresh_response_name,
    MAKE_create_child_window : MAKE_create_child_window,
    MAKE_create_child_window_name : MAKE_create_child_window_name,
    MAKE_create_child_window_response : MAKE_create_child_window_response,
    MAKE_create_child_window_response_name : MAKE_create_child_window_response_name,
    MAKE_create_child_window_display : MAKE_create_child_window_display,
    MAKE_create_child_window_display_name : MAKE_create_child_window_display_name,
    MAKE_close_child_window : MAKE_close_child_window,
    MAKE_close_child_window_name : MAKE_close_child_window_name,
    MAKE_close_child_window_response : MAKE_close_child_window_response,
    MAKE_close_child_window_response_name : MAKE_close_child_window_response_name,
    MAKE_close_child_window_display : MAKE_close_child_window_display,
    MAKE_close_child_window_display_name : MAKE_close_child_window_display_name,
}