import {MessageBroker} from "./messages";
import {ChildProcessWithoutNullStreams, spawn} from "child_process";

export interface  ServiceDef {
    subprocess?: ChildProcessWithoutNullStreams;
    name:string,
    root:string,
    command:string,
}
export class ServicesManager {
    private server: MessageBroker;
    private defs: ServiceDef[];


    constructor(server: MessageBroker, defs: ServiceDef[]) {
        this.server = server
        this.defs = defs || []
    }
    handle(msg:any) {
    }
    is_service(msg:any) {
        return false
    }
    start() {
        this.log('starting services')
        this.log(this.defs)
        this.defs.forEach(def => {
            try {
                let args: string[] = [def.root,
                    // `ws://${this.hostname}:${this.websocket_port}`,
                    // app.id,
                    // ...app.args
                ]
                def.subprocess = spawn('cargo', ['run'], {
                    cwd: def.root,
                })
                // @ts-ignore
                def.subprocess.stdout.on('data', (data: any) => this.log(`STDOUT ${def.name}: ${data}`))
                // @ts-ignore
                def.subprocess.stderr.on('data', (data: any) => this.log(`STDERR ${def.name}: ${data}`))
                def.subprocess.on('close', (e) => {
                    this.log("closed", e)
                })
                def.subprocess.on('error', (e) => {
                    this.log('error', e)
                })
                this.log("started service", def.root, def.command)
            } catch (e) {
                this.log(e)
            }
        })
    }

    private log(...args:any) {
        console.log("SERVICES",...args)
    }
}


