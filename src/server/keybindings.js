import {INPUT} from 'idealos_schemas/js/input.js'

export class KeybindingsManager {
    constructor(server,opts) {
        this.server = server
        this.keybindings = opts.keybindings
        console.log("keybindings",this.keybindings)
    }

    handle_keybindings(msg) {
        // console.log("keybindings",this.keybindings,msg)
        if(msg.type === INPUT.TYPE_KeyboardDown) {
            // console.log("msg is",msg)
            let binding = this.keybindings.bindings.find(e => e.code === msg.code && e.control === msg.control)
            if(binding) {
                // console.log('doing binding',binding)
                if(!binding.command) throw new Error("binding missing command " + JSON.stringify(binding) )
                this.server.cons.forward_to_app(msg.app,INPUT.MAKE_Action({
                    command:binding.command,
                    app:msg.app,
                    window:msg.window,
                }))
                return
            }
        }
        this.server.cons.forward_to_app(msg.app,msg)
    }

}
