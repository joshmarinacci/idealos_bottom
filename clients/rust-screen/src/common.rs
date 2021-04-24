use std::collections::HashMap;
use websocket::OwnedMessage;
use std::sync::mpsc::Sender;
use crate::window::Window;
use serde_json::{json};
use crate::windows_schemas::{window_refresh_request, window_refresh_request_name};

pub fn send_refresh_all_windows_request(windows: &HashMap<String, Window>, sender:&Sender<OwnedMessage>) {
    println!("sending out full refresh request");
    for(_, win) in windows {
        println!("sending to window {}", win.id);
        let msg2 = window_refresh_request {
            type_: window_refresh_request_name.to_string(),
            target:win.owner.clone(),
            window:win.id.clone(),
        };
        let val = json!(msg2);
        let txt = OwnedMessage::Text(val.to_string());
        sender.send(txt);
    }
}
