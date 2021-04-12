use core::option::Option::None;
use core::result::Result::{Err, Ok};
use serde_json::error::Result;
use serde_json::value::Value;
use websocket::receiver::Reader;
use std::net::TcpStream;
use std::sync::mpsc::Sender;
use websocket::OwnedMessage;
use crate::messages::{RenderMessage, WindowListMessage, OpenWindowScreen, DrawPixelMessage, FillRectMessage, DrawImageMessage, CloseWindowScreen};

fn parse_message(renderloop_send:&Sender<RenderMessage>, txt:String) -> Result<()>{
    let v: Value = serde_json::from_str(txt.as_str())?;
    match &v["type"] {
        Value::String(msg_type) => {
            match &msg_type[..] {
                "SCREEN_WINDOW_LIST" => {
                    let msg:WindowListMessage = serde_json::from_str(txt.as_str())?;
                    renderloop_send.send(RenderMessage::WindowList(msg));
                    ()
                },
                "WINDOW_OPEN_SCREEN" => {
                    let msg:OpenWindowScreen = serde_json::from_str(txt.as_str())?;
                    renderloop_send.send(RenderMessage::OpenWindow(msg));
                    ()
                },
                "DRAW_PIXEL"  => {
                    let msg:DrawPixelMessage = serde_json::from_str(txt.as_str())?;
                    renderloop_send.send(RenderMessage::DrawPixel(msg));
                    ()
                },
                "DRAW_RECT"   => {
                    let msg:FillRectMessage = serde_json::from_str(txt.as_str())?;
                    renderloop_send.send(RenderMessage::FillRect(msg));
                    ()
                },
                "DRAW_IMAGE"   => {
                    let msg:DrawImageMessage = serde_json::from_str(txt.as_str())?;
                    renderloop_send.send(RenderMessage::DrawImage(msg));
                    ()
                },
                "WINDOW_CLOSED" => {
                    let msg:CloseWindowScreen = serde_json::from_str(txt.as_str())?;
                    renderloop_send.send(RenderMessage::CloseWindow(msg));
                    ()
                }
                _ => {
                    println!("some other message type {}",txt)
                }
            }
        }
        _ => {
            println!("data that's not a message!!")
        }
    }
   Ok(())
}

pub fn process_incoming(receiver: &mut Reader<TcpStream>, websocket_sending_tx: &Sender<OwnedMessage>, render_loop_send: &Sender<RenderMessage>) {
    // Receive loop
    for message in receiver.incoming_messages() {
        //if error, send back a close message directly
        let message = match message {
            Ok(m) => m,
            Err(e) => {
                println!("Receive Loop: {:?}", e);
                let _ = websocket_sending_tx.send(OwnedMessage::Close(None));
                return;
            }
        };
        match message {
            OwnedMessage::Close(_) => {
                println!("got a close message");
                // Got a close message, so send a close message and return
                let _ = websocket_sending_tx.send(OwnedMessage::Close(None));
                return;
            }
            // Say what we received
            OwnedMessage::Text(txt) => {
                // println!("received message {:?}", txt);
                parse_message(render_loop_send, txt);
            }
            _ => {
                println!("Receive Loop: {:?}", message);
            },
        }
    }
}
