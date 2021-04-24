import assert from 'assert'
import {
    hostname,
    start_message_server,
    stop_message_server,
    websocket_port
} from '../src/server/server.js'
import {default as WebSocket} from 'ws'
import {make_message, SCHEMAS} from '../src/canvas/messages.js'
import {RESOURCES} from '../src/schemas/resources_schemas.js'


async function connect_and_wait() {
    let addr = `ws://${hostname}:${websocket_port}`

    let server = await start_message_server()
    let ws = new WebSocket(addr);
    return new Promise((res,rej)=>{
        ws.on('open', () => {
            console.log("test opened");
            ws.send(JSON.stringify(make_message(SCHEMAS.TEST.START, {sender: 'TEST'})))
            // ws.send(JSON.stringify(make_message(RESOURCES.MAKE_ResourceGet, {
            //     sender: 'TEST',
            //     'resource': 'theme'
            // })))
        })
        ws.on("message", (data) => {
            let msg = JSON.parse(data)
            console.log("got a response", msg)
            if (msg.type === SCHEMAS.GENERAL.CONNECTED.NAME) {
                // console.log("got the changed message back. shut it down")
                // stop_message_server(server)
                //
                res({
                    server,ws
                })
            }
        })
    })
}

async function stop_all(info) {
    await stop_message_server(info.server)
    console.log("everything stopped")
}

function send_message(info, msg) {
    info.ws.send(JSON.stringify(msg))
}

async function wait_for_type(info, type) {
    console.log("waiting for type",type)
    return new Promise((res,rej)=>{

    info.ws.on('message',(data)=>{
        let msg = JSON.parse(data)
        console.log("got the message",msg)
        if(msg.type === type.NAME) {
            console.log("matched response",msg.type)
            res(msg)
        }
    })
    })
}

function log(...args) {
    console.log(...args)
}

describe('resource tests',function() {
    it('checks for an invalid resource', async function() {
        let info = await connect_and_wait()
        send_message(info, RESOURCES.MAKE_ResourceGet({sender:'TEST','resource':'themes'}))
        await wait_for_type(info, RESOURCES.TYPE_ResourceInvalid)
        await stop_all(info)
    })

    it('checks for a valid resource', async function() {
        let info = await connect_and_wait()
        send_message(info, RESOURCES.MAKE_ResourceGet({sender:'TEST','resource':'test'}))
        let msg = await wait_for_type(info, RESOURCES.TYPE_ResourceChanged)
        console.log('received message',msg)
        let payload = JSON.parse(String.fromCharCode(...msg.data.data))
        log('payload is',payload)
        assert.deepStrictEqual(payload,{"type":"test"})
        await stop_all(info)
    })

})
