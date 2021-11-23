import Nano from 'nano';
import {CentralServer} from "../server";
import path from "path";

export const INGEST_FILE = 'ingest-file';
export const DB_INFO = "db-info";
export const GET_DOCUMENT_INFO = 'get-document-info'
export const FIND_DOCUMENT= "find-document";
const MIMETYPES_JSON = {
    "image/png":["png"],
    "image/svg+xml":['svg'],
    "image/jpeg":["jpeg",'jpg'],
    "image/bmp":['bmp'],
    "image/gif":['gif'],

    "audio/mpeg":["mp3"],
    "audio/wav":["wav"],

    "application/pdf":["pdf"],
    "application/json":["json"],
    "application/zip":["zip"],
    "application/gzip":["gz"],
    "application/rtf":["rtf"],
    "application/xml":["xml"],

    "text/c-lang":["c"],
    "text/css":['css'],
    "text/csv":['csv'],
    "text/html":['htm','html'],
    "text/javascript":['js'],
    "text/markdown":['md'],
    "text/plain":['txt'],
    "text/rust-lang":["rs"],

    "font/ttf":['ttf'],

}
const MIMETYPES:Map<string,string> = new Map<string, string>()
Object.keys(MIMETYPES_JSON).forEach(type => {
    let exts:string[] = MIMETYPES_JSON[type]
    exts.forEach(ext => {
        MIMETYPES.set(ext,type)
    })
})

export interface DBDocument {
    id:string,
    mimetype:string
}

class DummyDoc implements DBDocument {
    id: string;
    mimetype: string;

    constructor(id, mimetype: string) {
        this.id = id
        this.mimetype = mimetype
    }

}

export class CloudDBService {
    private config: {
        dbname: string;
        connect: string;
        create: boolean,
        recreate:boolean,
    };
    private conn: any;
    private db: any;
    log(...args) {
        console.log("CloudDBService:",...args)
    }
    constructor(db2_config: { dbname: string; connect: string, create:boolean, recreate:boolean }) {
        this.config = db2_config
    }

    async start() {
        this.log('starting',this.config.connect)
        this.conn = Nano(this.config.connect)
        this.log("using the database",this.config.dbname)
        if(this.config.recreate) {
            //delete first then make
            await this.conn.db.destroy(this.config.dbname)
            this.log("deleted")
            await this.conn.db.create(this.config.dbname)
            this.log('created')
            this.db = this.conn.db.use(this.config.dbname)
            this.log("db is",this.db)
            return
        }
        try {
            this.db = this.conn.db.use(this.config.dbname)
            this.log("calling list")
            let info = await this.db.info()
            this.log("db info is",info)
        } catch (e) {
            this.log("error. need to make the database?", this.config.create)
            if(this.config.create) {
                this.log('creating')
                await this.conn.db.create(this.config.dbname)
                this.log('created')
                this.db = this.conn.db.use(this.config.dbname)
                this.log("db is",this.db)
            }
        }
    }

    is_database(msg: any) {
        if(msg.type === INGEST_FILE) return true
        if(msg.type === GET_DOCUMENT_INFO) return true
        if(msg.type === FIND_DOCUMENT) return true
        if(msg.type === DB_INFO) return true
        return false;
    }

    handle(msg: any, server:CentralServer) {
        function send_response(original: any, fields: any) {
            let msg2 = {
                type: original.type + "-response",
                id: "msg_" + Math.floor((Math.random() * 10000)),
                response_to: original.id,
                connection_id:original.connection_id,
            }
            Object.keys(fields).forEach(key => msg2[key] = fields[key])
            console.log("sending",msg2)
            let ws = server.connection_map.get(msg2.connection_id);
            ws.send(JSON.stringify(msg2))
        }

        if(msg.type === DB_INFO) return this.get_info()
            .then(info => send_response(msg,{ info:info }))
        if(msg.type === INGEST_FILE) return this.ingest(msg.file)
            .then(doc => send_response(msg, {docid:doc.id,mimetype:doc.mimetype}))
        if(msg.type === GET_DOCUMENT_INFO) return this.get_doc(msg.docid)
            .then(doc => send_response(msg, {docid:doc.id,info:doc}))
        if(msg.type === FIND_DOCUMENT) return this.find(msg.query)
            .then(docs => send_response(msg,{results:docs}))
        return undefined;
    }

    async ingest(file: string):Promise<DBDocument> {
        // this.log("ingesting file",file)
        let ext = path.extname(file).toLowerCase()
        if(ext.startsWith('.')) ext = ext.substring(1)
        let obj = {
            type:"document",
            category:"document",
            props: {
                name: path.basename(file, path.extname(file)),
                ext: ext,
                mimetype: "application/octet-stream"
            }
        }
        if(MIMETYPES.has(obj.props.ext)) {
            obj.props.mimetype = MIMETYPES.get(obj.props.ext)
        } else {
            this.log("unrecognized extension",obj.props.ext)
        }
        // this.log("obj is",obj)
        const resp = await this.db.insert(obj)
        // this.log("response is",resp)
        if(resp.ok) return new DummyDoc(resp.id, obj.props.mimetype)
        return new DummyDoc("error","error")
    }

    async find(raw_query: string):Promise<any> {
        this.log("looking for",raw_query)
        let parts = raw_query.split('=').map(t => t.trim())
        let q = {}
        q[parts[0]] = { "$eq":parts[1] }
        let query = {
            selector:{
                type: { "$eq":"document"},
                props:q
            }
        }
        this.log("qq",query)
        return await this.db.find(query)
    }

    async stop() {
        this.log("no way to really shut down the connection")
    }

    async load_attachment(id):Promise<any> {

    }

    async check_connection():Promise<boolean> {
        return false
    }

    async delete(testdb: string) {

    }

    private async get_doc(docid: string): Promise<any> {
        let doc = await this.db.get(docid)
        this.log("got the doc", doc)
        return doc
    }

    private async get_info() {
        return await this.db.info()
    }
}

