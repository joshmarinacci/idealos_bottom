import {App} from './toolkit/guitoolkit.js'
import {CONSTRAINTS, TabPanel, VBox} from './toolkit/panels.js'
import {Label, MultilineLabel} from './toolkit/text.js'
import {WINDOWS} from 'idealos_schemas/js/windows.js'

import SI from 'systeminformation'
import {Button} from './toolkit/buttons.js'

SI.cpuCurrentSpeed().then(data => console.log(data))
SI.cpuTemperature().then(data => console.log(data))

let app = new App(process.argv)

function toGB(total) {
    return (total/1024/1024/1024).toFixed(1) + ' GB'
}

function toTime(mins) {
    let hrs = Math.floor(mins/60)
    let min = mins-hrs*60
    return `${hrs}:${min}`
}

async function init() {
    await app.a_init()
    let win = await app.open_window(50, 50, 300, 200, 'plain')

    let system = await SI.system()
    let s_system = `${system.manufacturer} - ${system.model} - ${system.serial}`
    let cpu = await SI.cpu()
    let s_cpu = `${cpu.manufacturer} - ${cpu.brand} - ${cpu.vendor}`

    let speed = await SI.cpuCurrentSpeed()
    let temp = await SI.cpuTemperature()

    let mem = await SI.mem()
    let battery = await SI.battery()
    let bt = "no battery"
    if(battery.hasBattery) {
        bt = `battery ${battery.percent}%  -  ${toTime(battery.timeRemaining)} remaining`
    }
    let os = await SI.osInfo()
    let currentLoad = await SI.currentLoad()

    //getting wifi networks takes several seconds
    // let wifi = await SI.wifiNetworks()
    // console.log(wifi)

    let info_panel = new VBox({
        width: 300,
        height: 200,
        constraint:CONSTRAINTS.WRAP,
        children:[
            new Label({text:"About Ideal OS"}),
            new MultilineLabel({width:300, text:s_system + "\n" + s_cpu}),
            new MultilineLabel({width:300, text:`CPU speed ${speed.avg} - temp ${temp.main?temp.main:"??"}`}),
            new MultilineLabel({width:300, text: `RAM ${toGB(mem.free)} / ${toGB(mem.total)}`}),
            new MultilineLabel({text:bt}),
            new MultilineLabel({width:300, text:`host os: ${os.distro}-${os.release}-${os.codename}`}),
            new MultilineLabel({width:300, text:`network ${os.hostname}`}),
            new MultilineLabel({width:300, text:`CPU Load ${Math.floor(currentLoad.currentLoad)}% `}),
        ]
    })
    let background_panel = new Button({
        text:"hello"
    })
    win.root = new VBox({
        width:win.width,
        height:win.height,
        fill_color:'magenta',
        constraint:CONSTRAINTS.FILL,
        children:[
            new TabPanel({
                tab_labels: ["system info", "background"],
                tab_children:[
                    info_panel,
                    background_panel,
                ]
            })
        ]
    })
    win.redraw()
}
app.on('start',()=>init())
app.on(WINDOWS.TYPE_window_close_request,(e) => {
    app.a_shutdown().then(()=>console.log("finished"))
})
