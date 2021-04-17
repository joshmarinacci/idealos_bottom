import {make_message, SCHEMAS} from '../canvas/messages.js'
import path from 'path'
import fs from 'fs'

const RESOURCES = {
    'test': {
        path: 'test.json',
        mime: 'text/json'
    },
    'theme': {
        path: 'theme.json',
        mime: 'text/json'
    }
}

export class ResourceManager {
    constructor(logger, responder) {
        this.log = logger
        this.respond = responder
    }

    async get_resource(msg) {
        this.log("get resource", msg)
        if (!RESOURCES.hasOwnProperty(msg.resource)) return this.respond(msg, make_message(SCHEMAS.RESOURCE.INVALID, {resource: msg.resource}))
        let resource = RESOURCES[msg.resource]
        let pth = path.join('resources', resource.path)
        this.log("reading resource", msg.resource, 'at', pth)
        try {
            let data = await fs.promises.readFile(pth)
            this.respond(msg, make_message(SCHEMAS.RESOURCE.CHANGED, {
                data: data,
                resource: msg.resource,
                mimetype: resource.mime
            }))
        } catch (e) {
            this.log(e);
            this.log('sending to ', msg.sender)
            this.respond(msg, make_message(SCHEMAS.RESOURCE.INVALID, {resource: msg.resource}))
        }
    }
}