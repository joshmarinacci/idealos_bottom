import Lame from "node-lame"
import Play from "audio-play"
import Load from "audio-loader"

let pth = "resources/hilton.mp3"

const decoder = new Lame.Lame({
    output:'buffer'
}).setFile(pth)

let player = null
decoder.decode()
    .then(()=>{
        return Load(decoder.getBuffer())
    })
    .then(buf => {
        player = Play(buf)
        setTimeout(()=>{
            player.pause()
        },1000)
        setTimeout(()=>{
            player.play()
        },2000)

    })
    .catch(e => {
        console.log("error",e)
    })
