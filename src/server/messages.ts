export interface MessageBroker {

}

export interface Message {
    id?:string,
    type:string,
    sender?:string,
}
