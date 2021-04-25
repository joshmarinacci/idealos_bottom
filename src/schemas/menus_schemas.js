const TYPE_node_type = "MAKE_node_type_name"
export function MAKE_node_type(value) {
    if(value === "item") return value
    if(value === "top") return value
    if(value === "root") return value
    throw new Error("MAKE_node_type: invalid value"+value)
}
const TYPE_keystroke_obj = "MAKE_keystroke_obj_name"
function MAKE_keystroke_obj(data) {
    let obj = {}
    obj.type = TYPE_keystroke_obj
    if(!data.hasOwnProperty('modifier')) throw new Error("object 'keystroke_obj' is missing property 'modifier' ")
    if(data.modifier === undefined) throw new Error("object 'keystroke_obj has undefined property modifier")
    obj.modifier = data.modifier
    
    if(!data.hasOwnProperty('key')) throw new Error("object 'keystroke_obj' is missing property 'key' ")
    if(data.key === undefined) throw new Error("object 'keystroke_obj has undefined property key")
    obj.key = data.key
    
    return obj
}
const TYPE_item = "MAKE_item_name"
function MAKE_item(data) {
    let obj = {}
    obj.type = TYPE_item
    if(!data.hasOwnProperty('node_type')) throw new Error("object 'item' is missing property 'node_type' ")
    if(data.node_type === undefined) throw new Error("object 'item has undefined property node_type")
    obj.node_type = MAKE_node_type(data.node_type)
    
    if(!data.hasOwnProperty('label')) throw new Error("object 'item' is missing property 'label' ")
    if(data.label === undefined) throw new Error("object 'item has undefined property label")
    obj.label = data.label
    
    if(!data.hasOwnProperty('event')) throw new Error("object 'item' is missing property 'event' ")
    if(data.event === undefined) throw new Error("object 'item has undefined property event")
    obj.event = data.event
    
    if(!data.hasOwnProperty('keystroke')) throw new Error("object 'item' is missing property 'keystroke' ")
    if(data.keystroke === undefined) throw new Error("object 'item has undefined property keystroke")
    obj.keystroke = MAKE_keystroke_obj(data.keystroke)
    
    return obj
}
const TYPE_item_array = "MAKE_item_array_name"
export function MAKE_item_array(arr) {
    return arr
}
const TYPE_root = "MAKE_root_name"
function MAKE_root(data) {
    let obj = {}
    obj.type = TYPE_root
    if(!data.hasOwnProperty('type')) throw new Error("object 'root' is missing property 'type' ")
    if(data.type === undefined) throw new Error("object 'root has undefined property type")
    obj.type = MAKE_node_type(data.type)
    
    if(!data.hasOwnProperty('children')) throw new Error("object 'root' is missing property 'children' ")
    if(data.children === undefined) throw new Error("object 'root has undefined property children")
    obj.children = MAKE_item_array(data.children)
    
    return obj
}
const TYPE_create_menu_tree_message = "MAKE_create_menu_tree_message_name"
function MAKE_create_menu_tree_message(data) {
    let obj = {}
    obj.type = TYPE_create_menu_tree_message
    if(!data.hasOwnProperty('type')) throw new Error("object 'create_menu_tree_message' is missing property 'type' ")
    if(data.type === undefined) throw new Error("object 'create_menu_tree_message has undefined property type")
    obj.type = data.type
    
    if(!data.hasOwnProperty('menu')) throw new Error("object 'create_menu_tree_message' is missing property 'menu' ")
    if(data.menu === undefined) throw new Error("object 'create_menu_tree_message has undefined property menu")
    obj.menu = MAKE_root(data.menu)
    
    return obj
}
export const MENUS = {
    MAKE_node_type : MAKE_node_type,
    TYPE_node_type : TYPE_node_type,
    MAKE_keystroke_obj : MAKE_keystroke_obj,
    TYPE_keystroke_obj : TYPE_keystroke_obj,
    MAKE_item : MAKE_item,
    TYPE_item : TYPE_item,
    MAKE_item_array : MAKE_item_array,
    TYPE_item_array : TYPE_item_array,
    MAKE_root : MAKE_root,
    TYPE_root : TYPE_root,
    MAKE_create_menu_tree_message : MAKE_create_menu_tree_message,
    TYPE_create_menu_tree_message : TYPE_create_menu_tree_message,
}