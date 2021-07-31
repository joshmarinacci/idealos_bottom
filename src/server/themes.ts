import {make_response} from "./common.js";

export const THEME_GROUP = {
    "get_control_theme":"get_control_theme",
    "theme-set":"theme-set"
}

export function is_theme(msg:any) {
    return Object.values(THEME_GROUP).some(n => msg.type === n)
}

export class ThemeManager {
    private server: any;
    private themes: {light:any, dark:any};
    private uitheme: any;
    constructor(server:any,themes: any, uitheme: any) {
        this.server = server
        // @ts-ignore
        this.themes = null
        if (themes) {
            this.themes = themes
            this.uitheme = this.themes['light']
        }
        if(uitheme) this.uitheme = uitheme
    }

    log(...args: any[]) {
        console.log("THEME_MANAGER",...args)
    }

    handle(msg: { type: string; }) {
        if(msg.type === "get_control_theme") return this.get_control_theme(msg)
        if(msg.type === "theme-set") return this.set_theme(msg)
    }
    set_theme(msg:any) {
        // console.log("vailable themese",server.themes)
        // console.log("target is",msg.name)
        // @ts-ignore
        if(!this.themes[msg.name]) {
            console.log(`missing theme name ${msg.name}`)
        } else {
            // @ts-ignore
            this.uitheme = this.themes[msg.name]
            let resp = make_response(msg, {type: "theme-changed", name: msg.name})
            this.server.app_manager.send_to_type("APP", resp)
            this.server.app_manager.send_to_type("MENUBAR", resp)
        }
    }
    get_control_theme(msg:any) {
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
            return this.server.app_manager.send_to_app(msg.app, msg2)
        }
        // console.log('name is',msg.name)
        if(this.uitheme[msg.name]) {
            let msg2 = make_response(msg,{
                type:"get_control_theme_response",
                theme: this.uitheme[msg.name]
            })
            return this.server.app_manager.send_to_app(msg.app, msg2)
        } else {
            let msg2 = make_response(msg,{
                type:"get_control_theme_response",
                theme: this.uitheme['*']
            })
            return this.server.app_manager.send_to_app(msg.app, msg2)
        }
    }
}
