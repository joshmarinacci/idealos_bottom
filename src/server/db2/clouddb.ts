import Nano from 'nano';
import {CentralServer} from "../server";
import path from "path";

export const INGEST_FILE = 'ingest-file';
export const GET_DOCUMENT_INFO = 'get-document-info'
export const FIND_DOCUMENT= "find-document";

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
        create: boolean
    };
    private conn: any;
    private db: any;
    log(...args) {
        console.log("CloudDBService:",...args)
    }
    constructor(db2_config: { dbname: string; connect: string, create:boolean }) {
        this.config = db2_config
    }

    async start() {
        this.log('starting',this.config.connect)
        try {
            this.conn = Nano(this.config.connect)
            this.log("using the database",this.config.dbname)
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
        return false;
    }

    handle(msg: any, server:CentralServer) {
        if(msg.type === INGEST_FILE) {
            this.ingest(msg.file).then(doc => {
                this.log("succeded ingesting",doc)
                let msg2 = {
                    type: msg.type + "-response",
                    id: "msg_" + Math.floor((Math.random() * 10000)),
                    response_to: msg.id,
                    connection_id:msg.connection_id,
                    docid:doc.id,
                    mimetype:doc.mimetype,
                }
                this.log("sending back",msg2)
                let ws = server.connection_map.get(msg2.connection_id);
                ws.send(JSON.stringify(msg2))
            })
        }
        if(msg.type === GET_DOCUMENT_INFO) {
            this.get_doc(msg.docid).then(doc => {
                this.log("succeded finding doc info",doc)
                let msg2 = {
                    type: msg.type + "-response",
                    id: "msg_" + Math.floor((Math.random() * 10000)),
                    response_to: msg.id,
                    connection_id:msg.connection_id,
                    docid:doc.id,
                    info:doc,
                }
                this.log("sending back",msg2)
                let ws = server.connection_map.get(msg2.connection_id);
                ws.send(JSON.stringify(msg2))
            })
        }
        if(msg.type === FIND_DOCUMENT) {
            this.find(msg.query).then(docs => {
                this.log("docs returned",docs)
                let msg2 = {
                    type: msg.type + "-response",
                    id: "msg_" + Math.floor((Math.random() * 10000)),
                    response_to: msg.id,
                    connection_id:msg.connection_id,
                    results:docs,
                }
                let ws = server.connection_map.get(msg2.connection_id);
                ws.send(JSON.stringify(msg2))
            })
        }
        return undefined;
    }

    async ingest(file: string):Promise<DBDocument> {
        this.log("ingesting file",file)
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
        if(obj.props.ext === 'mp3') {
            obj.props.mimetype = "audio/mpeg"
        }
        this.log("obj is",obj)
        const resp = await this.db.insert(obj)
        this.log("response is",resp)
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
}

