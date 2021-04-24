const TYPE_ResourceGet = "MAKE_ResourceGet_name"
function MAKE_ResourceGet(data) {
    let obj = {}
    obj.type = TYPE_ResourceGet
    if(!data.hasOwnProperty('resource')) throw new Error("object 'ResourceGet' is missing property 'resource' ")
    obj.resource = data.resource
    
    if(!data.hasOwnProperty('sender')) throw new Error("object 'ResourceGet' is missing property 'sender' ")
    obj.sender = data.sender
    
    return obj
}
const TYPE_ResourceSet = "MAKE_ResourceSet_name"
function MAKE_ResourceSet(data) {
    let obj = {}
    obj.type = TYPE_ResourceSet
    if(!data.hasOwnProperty('resource')) throw new Error("object 'ResourceSet' is missing property 'resource' ")
    obj.resource = data.resource
    
    if(!data.hasOwnProperty('data')) throw new Error("object 'ResourceSet' is missing property 'data' ")
    obj.data = data.data
    
    return obj
}
const TYPE_ResourceChanged = "MAKE_ResourceChanged_name"
function MAKE_ResourceChanged(data) {
    let obj = {}
    obj.type = TYPE_ResourceChanged
    if(!data.hasOwnProperty('resource')) throw new Error("object 'ResourceChanged' is missing property 'resource' ")
    obj.resource = data.resource
    
    if(!data.hasOwnProperty('data')) throw new Error("object 'ResourceChanged' is missing property 'data' ")
    obj.data = data.data
    
    if(!data.hasOwnProperty('mimetype')) throw new Error("object 'ResourceChanged' is missing property 'mimetype' ")
    obj.mimetype = data.mimetype
    
    return obj
}
const TYPE_ResourceInvalid = "MAKE_ResourceInvalid_name"
function MAKE_ResourceInvalid(data) {
    let obj = {}
    obj.type = TYPE_ResourceInvalid
    if(!data.hasOwnProperty('resource')) throw new Error("object 'ResourceInvalid' is missing property 'resource' ")
    obj.resource = data.resource
    
    return obj
}
export const RESOURCES = {
    MAKE_ResourceGet : MAKE_ResourceGet,
    TYPE_ResourceGet : TYPE_ResourceGet,
    MAKE_ResourceSet : MAKE_ResourceSet,
    TYPE_ResourceSet : TYPE_ResourceSet,
    MAKE_ResourceChanged : MAKE_ResourceChanged,
    TYPE_ResourceChanged : TYPE_ResourceChanged,
    MAKE_ResourceInvalid : MAKE_ResourceInvalid,
    TYPE_ResourceInvalid : TYPE_ResourceInvalid,
}