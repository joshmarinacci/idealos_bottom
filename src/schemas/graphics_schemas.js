const TYPE_DrawPixel = "MAKE_DrawPixel_name"
function MAKE_DrawPixel(data) {
    let obj = {}
    obj.type = TYPE_DrawPixel
    if(!data.hasOwnProperty('window')) throw new Error("object 'DrawPixel' is missing property 'window' ")
    if(data.window === undefined) throw new Error("object 'DrawPixel has undefined property window")
    obj.window = data.window
    
    if(!data.hasOwnProperty('color')) throw new Error("object 'DrawPixel' is missing property 'color' ")
    if(data.color === undefined) throw new Error("object 'DrawPixel has undefined property color")
    obj.color = data.color
    
    if(!data.hasOwnProperty('x')) throw new Error("object 'DrawPixel' is missing property 'x' ")
    if(data.x === undefined) throw new Error("object 'DrawPixel has undefined property x")
    obj.x = data.x
    
    if(!data.hasOwnProperty('y')) throw new Error("object 'DrawPixel' is missing property 'y' ")
    if(data.y === undefined) throw new Error("object 'DrawPixel has undefined property y")
    obj.y = data.y
    
    return obj
}
const TYPE_DrawRect = "MAKE_DrawRect_name"
function MAKE_DrawRect(data) {
    let obj = {}
    obj.type = TYPE_DrawRect
    if(!data.hasOwnProperty('window')) throw new Error("object 'DrawRect' is missing property 'window' ")
    if(data.window === undefined) throw new Error("object 'DrawRect has undefined property window")
    obj.window = data.window
    
    if(!data.hasOwnProperty('color')) throw new Error("object 'DrawRect' is missing property 'color' ")
    if(data.color === undefined) throw new Error("object 'DrawRect has undefined property color")
    obj.color = data.color
    
    if(!data.hasOwnProperty('x')) throw new Error("object 'DrawRect' is missing property 'x' ")
    if(data.x === undefined) throw new Error("object 'DrawRect has undefined property x")
    obj.x = data.x
    
    if(!data.hasOwnProperty('y')) throw new Error("object 'DrawRect' is missing property 'y' ")
    if(data.y === undefined) throw new Error("object 'DrawRect has undefined property y")
    obj.y = data.y
    
    if(!data.hasOwnProperty('width')) throw new Error("object 'DrawRect' is missing property 'width' ")
    if(data.width === undefined) throw new Error("object 'DrawRect has undefined property width")
    obj.width = data.width
    
    if(!data.hasOwnProperty('height')) throw new Error("object 'DrawRect' is missing property 'height' ")
    if(data.height === undefined) throw new Error("object 'DrawRect has undefined property height")
    obj.height = data.height
    
    return obj
}
const TYPE_DrawImage = "MAKE_DrawImage_name"
function MAKE_DrawImage(data) {
    let obj = {}
    obj.type = TYPE_DrawImage
    if(!data.hasOwnProperty('window')) throw new Error("object 'DrawImage' is missing property 'window' ")
    if(data.window === undefined) throw new Error("object 'DrawImage has undefined property window")
    obj.window = data.window
    
    if(!data.hasOwnProperty('x')) throw new Error("object 'DrawImage' is missing property 'x' ")
    if(data.x === undefined) throw new Error("object 'DrawImage has undefined property x")
    obj.x = data.x
    
    if(!data.hasOwnProperty('y')) throw new Error("object 'DrawImage' is missing property 'y' ")
    if(data.y === undefined) throw new Error("object 'DrawImage has undefined property y")
    obj.y = data.y
    
    if(!data.hasOwnProperty('width')) throw new Error("object 'DrawImage' is missing property 'width' ")
    if(data.width === undefined) throw new Error("object 'DrawImage has undefined property width")
    obj.width = data.width
    
    if(!data.hasOwnProperty('height')) throw new Error("object 'DrawImage' is missing property 'height' ")
    if(data.height === undefined) throw new Error("object 'DrawImage has undefined property height")
    obj.height = data.height
    
    if(!data.hasOwnProperty('pixels')) throw new Error("object 'DrawImage' is missing property 'pixels' ")
    if(data.pixels === undefined) throw new Error("object 'DrawImage has undefined property pixels")
    obj.pixels = MAKE_image_buffer(data.pixels)
    
    return obj
}
const TYPE_image_buffer = "MAKE_image_buffer_name"
export function MAKE_image_buffer(arr) {
    return arr
}
export const GRAPHICS = {
    MAKE_DrawPixel : MAKE_DrawPixel,
    TYPE_DrawPixel : TYPE_DrawPixel,
    MAKE_DrawRect : MAKE_DrawRect,
    TYPE_DrawRect : TYPE_DrawRect,
    MAKE_DrawImage : MAKE_DrawImage,
    TYPE_DrawImage : TYPE_DrawImage,
    MAKE_image_buffer : MAKE_image_buffer,
    TYPE_image_buffer : TYPE_image_buffer,
}