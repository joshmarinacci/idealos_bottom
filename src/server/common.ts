export function make_response(orig, settings) {
    let msg = {
        id: "msg_" + Math.floor((Math.random() * 10000)),
        response_to: orig.id
    }
    Object.entries(settings).forEach(([key, value]) => {
        msg[key] = value
    })
    return msg
}
