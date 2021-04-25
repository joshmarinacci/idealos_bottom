const TYPE_MouseDown = "MAKE_MouseDown_name"
function MAKE_MouseDown(data) {
    let obj = {}
    obj.type = TYPE_MouseDown
    if(!data.hasOwnProperty('x')) throw new Error("object 'MouseDown' is missing property 'x' ")
    if(data.x === undefined) throw new Error("object 'MouseDown has undefined property x")
    obj.x = data.x
    
    if(!data.hasOwnProperty('y')) throw new Error("object 'MouseDown' is missing property 'y' ")
    if(data.y === undefined) throw new Error("object 'MouseDown has undefined property y")
    obj.y = data.y
    
    if(!data.hasOwnProperty('target')) throw new Error("object 'MouseDown' is missing property 'target' ")
    if(data.target === undefined) throw new Error("object 'MouseDown has undefined property target")
    obj.target = data.target
    
    return obj
}
const TYPE_MouseUp = "MAKE_MouseUp_name"
function MAKE_MouseUp(data) {
    let obj = {}
    obj.type = TYPE_MouseUp
    if(!data.hasOwnProperty('x')) throw new Error("object 'MouseUp' is missing property 'x' ")
    if(data.x === undefined) throw new Error("object 'MouseUp has undefined property x")
    obj.x = data.x
    
    if(!data.hasOwnProperty('y')) throw new Error("object 'MouseUp' is missing property 'y' ")
    if(data.y === undefined) throw new Error("object 'MouseUp has undefined property y")
    obj.y = data.y
    
    if(!data.hasOwnProperty('target')) throw new Error("object 'MouseUp' is missing property 'target' ")
    if(data.target === undefined) throw new Error("object 'MouseUp has undefined property target")
    obj.target = data.target
    
    return obj
}
const TYPE_KeyboardDown = "MAKE_KeyboardDown_name"
function MAKE_KeyboardDown(data) {
    let obj = {}
    obj.type = TYPE_KeyboardDown
    if(!data.hasOwnProperty('keyname')) throw new Error("object 'KeyboardDown' is missing property 'keyname' ")
    if(data.keyname === undefined) throw new Error("object 'KeyboardDown has undefined property keyname")
    obj.keyname = data.keyname
    
    if(!data.hasOwnProperty('target')) throw new Error("object 'KeyboardDown' is missing property 'target' ")
    if(data.target === undefined) throw new Error("object 'KeyboardDown has undefined property target")
    obj.target = data.target
    
    return obj
}
const TYPE_KeyboardUp = "MAKE_KeyboardUp_name"
function MAKE_KeyboardUp(data) {
    let obj = {}
    obj.type = TYPE_KeyboardUp
    if(!data.hasOwnProperty('keyname')) throw new Error("object 'KeyboardUp' is missing property 'keyname' ")
    if(data.keyname === undefined) throw new Error("object 'KeyboardUp has undefined property keyname")
    obj.keyname = data.keyname
    
    if(!data.hasOwnProperty('target')) throw new Error("object 'KeyboardUp' is missing property 'target' ")
    if(data.target === undefined) throw new Error("object 'KeyboardUp has undefined property target")
    obj.target = data.target
    
    return obj
}
export const INPUT = {
    MAKE_MouseDown : MAKE_MouseDown,
    TYPE_MouseDown : TYPE_MouseDown,
    MAKE_MouseUp : MAKE_MouseUp,
    TYPE_MouseUp : TYPE_MouseUp,
    MAKE_KeyboardDown : MAKE_KeyboardDown,
    TYPE_KeyboardDown : TYPE_KeyboardDown,
    MAKE_KeyboardUp : MAKE_KeyboardUp,
    TYPE_KeyboardUp : TYPE_KeyboardUp,
}