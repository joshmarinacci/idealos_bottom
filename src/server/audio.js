import Lame from 'node-lame'
import Play from "audio-play"
import Load from "audio-loader"

// let pth = "resources/hilton.mp3"

export const AUDIO_GROUP = {
    "audio-server-play":"audio-server-play",
    "audio-server-pause":"audio-server-pause"
}

export function is_audio(msg) {
    return Object.values(AUDIO_GROUP).some(n => msg.type === n)
}

export class AudioService {
    constructor() {
        this.log("made an audio server")
        this.players = {}
    }
    log(...args) {
        console.log("AUDIO_SERVICE",...args)
    }
    handle(msg) {
        if(msg.type === "audio-server-play") return this.play(msg)
        if(msg.type === "audio-server-pause") return this.pause(msg)
    }
    load(pth) {
        if(this.players[pth]) return this.players[pth]
        const decoder = new Lame.Lame({output:'buffer'}).setFile(pth)
        return decoder.decode()
            .then(() => Load(decoder.getBuffer()))
            .then(buf => Play(buf))
            .then(player => this.players[pth]=player)
            .then(()=>this.players[pth])
    }
    async play(opts) {
        console.log("audio server playing",opts)
        let player = await this.load(opts.url)
        console.log("using the player",player)
        player.play()
    }
    async pause(opts) {
        console.log("audio server pausing", opts)
        let player = await this.load(opts.url)
        player.pause()
    }
}
