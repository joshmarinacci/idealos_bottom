export class AudioService {
    constructor() {
        console.log("made an audio server")
    }
    play(opts) {
        console.log("audio server playing",opts)
    }
    pause(opts) {
        console.log("audio server pausing",opts)
    }
}
