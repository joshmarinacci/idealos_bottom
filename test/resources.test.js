import assert from 'assert'
import {
    hostname,
    start_message_server,
    stop_message_server,
    websocket_port
} from '../src/server/server.js'
import {default as WebSocket} from 'ws'
import {make_message, SCHEMAS} from '../src/canvas/messages.js'



describe('basic tests',function() {
    it('starts and stops', async function () {
        //start the server
        let server = await start_message_server()
        console.log("doing the ws stuff")

        let addr = `ws://${hostname}:${websocket_port}`

        //open client
        let ws = new WebSocket(addr);
        ws.on('open', () => {
            console.log("test opened");
            ws.send(JSON.stringify(make_message(SCHEMAS.TEST.START, {sender: 'TEST'})))
            ws.send(JSON.stringify(make_message(SCHEMAS.RESOURCE.GET, {
                sender: 'TEST',
                'resource': 'theme'
            })))
        })
        ws.on("message", (data) => {
            let msg = JSON.parse(data)
            console.log("got a response", msg)
            if (msg.type === SCHEMAS.GENERAL.CONNECTED.NAME) {
                // console.log("got the changed message back. shut it down")
                // stop_message_server(server)
                //
            }
            if (msg.type === SCHEMAS.RESOURCE.INVALID.NAME) {
                console.log("got the invalid back. awesome!")
                stop_message_server(server)
            }
            if (msg.type === SCHEMAS.RESOURCE.CHANGED) {
                console.log("got the changed message back. shut it down")
                stop_message_server(server)
            }
        })
    })

    it('does an improved test', async function() {
        let server = await connect_and_wait()
        await send_message(server, make_message(SCHEMAS.RESOURCE.GET, {sender:'TEST','resource':'theme'}))
        await wait_for_type(server, SCHEMAS.RESOURCE.INVALID)
        await stop_message_server(server)
    })


})
