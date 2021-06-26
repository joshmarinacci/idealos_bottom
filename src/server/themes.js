import {make_response} from './connections.js'
import {AUDIO_GROUP} from './audio.js'

export const THEME_GROUP = {
    "get_control_theme":"get_control_theme",
    "theme-set":"theme-set"
}

export function is_theme(msg) {
    return Object.values(THEME_GROUP).some(n => msg.type === n)
}

export class ThemeManager {
    constructor(server,themes,uitheme) {
        this.server = server
        this.themes = null
        if (themes) {
            this.themes = themes
            this.uitheme = this.themes['light']
        }
        if(uitheme) this.uitheme = uitheme
        // this.log("made theme manager",this.themes,this.uitheme)
    }

    log(...args) {
        console.log("THEME_MANAGER",...args)
    }

    handle(msg) {
        if(msg.type === "get_control_theme") return this.get_control_theme(msg)
        if(msg.type === "theme-set") return this.set_theme(msg)
    }
    set_theme(msg) {
        // console.log("vailable themese",server.themes)
        // console.log("target is",msg.name)
        if(!this.themes[msg.name]) {
            console.log(`missing theme name ${msg.name}`)
        } else {
            this.uitheme = this.themes[msg.name]
            return this.server.cons.forward_to_all_apps(make_response(msg,{type:"theme-changed",name:msg.name}))
        }
    }
    get_control_theme(msg) {
        // console.log("doing get control theme",msg, server.uitheme)
        if(!this.uitheme) {
            //if no theme loaded, use a default
            let msg2 = make_response(msg,{
                type:"get_control_theme_response",
                theme:{
                    "background-color": "white",
                    "color": "black",
                    "border-color":'black'
                }
            })
            return this.server.cons.forward_to_app(msg.app, msg2)
        }
        // console.log('name is',msg.name)
        if(this.uitheme[msg.name]) {
            let msg2 = make_response(msg,{
                type:"get_control_theme_response",
                theme: this.uitheme[msg.name]
            })
            return this.server.cons.forward_to_app(msg.app, msg2)
        } else {
            let msg2 = make_response(msg,{
                type:"get_control_theme_response",
                theme: this.uitheme['*']
            })
            return this.server.cons.forward_to_app(msg.app, msg2)
        }
    }
}
