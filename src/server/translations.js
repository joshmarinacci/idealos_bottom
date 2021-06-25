import {make_response} from './connections.js'

export const TRANSLATION_GROUP = {
    "translation_get_value": "translation_get_value",
    "translation_set_language": "translation_set_language"
}

export function is_translation(msg) {
    return Object.values(TRANSLATION_GROUP).some(n => msg.type === n)
}

export class TranslationManager {
    constructor(server, translations) {
        this.server = server
        this.translations = []
        if (translations) this.translations = translations
        this.active_translation = this.translations[0]
    }

    handle(msg) {
        if (msg.type === TRANSLATION_GROUP.translation_get_value) return this.translation_get_value(msg)
        if (msg.type === TRANSLATION_GROUP.translation_set_language) return this.translation_set_language(msg)
    }

    translation_get_value(msg) {
        console.log("translation get value", msg, this.active_translation)
        if (!this.active_translation) {
            return this.server.cons.forward_to_app(msg.app, make_response(msg, {
                type: "translation_get_value_response",
                key: msg.key,
                value: "[?]",
                succeeded: false
            }))
        }
        if (!this.active_translation[msg.key]) {
            return this.server.cons.forward_to_app(msg.app, make_response(msg, {
                type: "translation_get_value_response",
                key: msg.key,
                value: "[?]",
                succeeded: false
            }))
        }
        let value = this.active_translation[msg.key]
        return this.server.cons.forward_to_app(msg.app, make_response(msg, {
            type: "translation_get_value_response",
            key: msg.key,
            value: value,
            succeeded: true
        }))
    }

    translation_set_language(msg) {
        console.log("hanlding message", msg)
        let trans = this.translations.find(t => t.language === msg.language)
        console.log("new trans is", trans)
        this.active_translation = trans
        console.log('sending to all apps', msg.app)
        return this.server.cons.forward_to_all_apps({
            type: "translation_language_changed",
            language: msg.language,
            succeeded: true
        })
    }
}
