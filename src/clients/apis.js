import {DEBUG} from 'idealos_schemas/js/debug.js'

export const SYSTEM = {
    start_app_by_name(name) {
        return DEBUG.MAKE_StartAppByName({ name:name })
    }
}
