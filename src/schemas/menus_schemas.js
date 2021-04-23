export function MAKE_node_type(value) {
    if(value === "item") return value
    if(value === "top") return value
    if(value === "root") return value
    throw new Error("MAKE_node_type: invalid value"+value)
}
function MAKE_keystroke_obj(data) {
    let obj = {}
    if(!data.hasOwnProperty('modifier')) throw new Error("object 'keystroke_obj' is missing property 'modifier' ")
    obj.modifier = data.modifier
    
    if(!data.hasOwnProperty('key')) throw new Error("object 'keystroke_obj' is missing property 'key' ")
    obj.key = data.key
    
    return obj
}
function MAKE_item(data) {
    let obj = {}
    if(!data.hasOwnProperty('type')) throw new Error("object 'item' is missing property 'type' ")
    obj.type = MAKE_node_type(data.type)
    
    if(!data.hasOwnProperty('label')) throw new Error("object 'item' is missing property 'label' ")
    obj.label = data.label
    
    if(!data.hasOwnProperty('event')) throw new Error("object 'item' is missing property 'event' ")
    obj.event = data.event
    
    if(!data.hasOwnProperty('keystroke')) throw new Error("object 'item' is missing property 'keystroke' ")
    obj.keystroke = MAKE_keystroke_obj(data.keystroke)
    
    return obj
}
export function MAKE_item_array(arr) {
    return arr
}
function MAKE_root(data) {
    let obj = {}
    if(!data.hasOwnProperty('type')) throw new Error("object 'root' is missing property 'type' ")
    obj.type = MAKE_node_type(data.type)
    
    if(!data.hasOwnProperty('children')) throw new Error("object 'root' is missing property 'children' ")
    obj.children = MAKE_item_array(data.children)
    
    return obj
}
function MAKE_create_menu_tree_message(data) {
    let obj = {}
    if(!data.hasOwnProperty('type')) throw new Error("object 'create_menu_tree_message' is missing property 'type' ")
    obj.type = data.type
    
    if(!data.hasOwnProperty('menu')) throw new Error("object 'create_menu_tree_message' is missing property 'menu' ")
    obj.menu = MAKE_root(data.menu)
    
    return obj
}
export const MENUS = {
    MAKE_node_type : MAKE_node_type,
    MAKE_keystroke_obj : MAKE_keystroke_obj,
    MAKE_item : MAKE_item,
    MAKE_item_array : MAKE_item_array,
    MAKE_root : MAKE_root,
    MAKE_create_menu_tree_message : MAKE_create_menu_tree_message,
}