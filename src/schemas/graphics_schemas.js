const TYPE_DrawPixel = "MAKE_DrawPixel_name"
function MAKE_DrawPixel(data) {
    let obj = {}
    obj.type = TYPE_DrawPixel
    if(!data.hasOwnProperty('window')) throw new Error("object 'DrawPixel' is missing property 'window' ")
    obj.window = data.window
    
    if(!data.hasOwnProperty('color')) throw new Error("object 'DrawPixel' is missing property 'color' ")
    obj.color = data.color
    
    if(!data.hasOwnProperty('x')) throw new Error("object 'DrawPixel' is missing property 'x' ")
    obj.x = data.x
    
    if(!data.hasOwnProperty('y')) throw new Error("object 'DrawPixel' is missing property 'y' ")
    obj.y = data.y
    
    return obj
}
const TYPE_DrawRect = "MAKE_DrawRect_name"
function MAKE_DrawRect(data) {
    let obj = {}
    obj.type = TYPE_DrawRect
    if(!data.hasOwnProperty('window')) throw new Error("object 'DrawRect' is missing property 'window' ")
    obj.window = data.window
    
    if(!data.hasOwnProperty('color')) throw new Error("object 'DrawRect' is missing property 'color' ")
    obj.color = data.color
    
    if(!data.hasOwnProperty('x')) throw new Error("object 'DrawRect' is missing property 'x' ")
    obj.x = data.x
    
    if(!data.hasOwnProperty('y')) throw new Error("object 'DrawRect' is missing property 'y' ")
    obj.y = data.y
    
    if(!data.hasOwnProperty('width')) throw new Error("object 'DrawRect' is missing property 'width' ")
    obj.width = data.width
    
    if(!data.hasOwnProperty('height')) throw new Error("object 'DrawRect' is missing property 'height' ")
    obj.height = data.height
    
    return obj
}
export const GRAPHICS = {
    MAKE_DrawPixel : MAKE_DrawPixel,
    TYPE_DrawPixel : TYPE_DrawPixel,
    MAKE_DrawRect : MAKE_DrawRect,
    TYPE_DrawRect : TYPE_DrawRect,
}