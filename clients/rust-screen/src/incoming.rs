use core::option::Option::None;
use core::result::Result::{Err, Ok};
use serde_json::error::Result;
use serde_json::value::Value;
use websocket::receiver::Reader;
use std::net::TcpStream;
use std::sync::mpsc::Sender;
use websocket::OwnedMessage;
use crate::messages::{RenderMessage, DrawPixelMessage, FillRectMessage, DrawImageMessage, CloseWindowScreen};
use crate::windows_schemas::{create_child_window_display, close_child_window_display, window_list_name, window_list, create_child_window_display_name, close_child_window_display_name, WindowOpenDisplay_name, WindowOpenDisplay};
use crate::graphics_schemas::{DrawPixel_name, DrawRect_name, DrawPixel, DrawRect};

fn parse_message(renderloop_send:&Sender<RenderMessage>, txt:String) -> Result<()>{
    let v: Value = serde_json::from_str(txt.as_str())?;
    match &v["type"] {
        Value::String(msg_type) => {
            if msg_type == WindowOpenDisplay_name {
                let msg:WindowOpenDisplay = serde_json::from_str(txt.as_str())?;
                renderloop_send.send(RenderMessage::OpenWindow(msg));
                return Ok(())
            }
            if msg_type == window_list_name {
                let msg:window_list = serde_json::from_str(txt.as_str())?;
                renderloop_send.send(RenderMessage::WindowList(msg));
                return Ok(())
            }
            if msg_type == create_child_window_display_name {
                let msg:create_child_window_display = serde_json::from_str(txt.as_str())?;
                renderloop_send.send(RenderMessage::CreateChildWindow(msg));
                return Ok(())
            }
            if msg_type == close_child_window_display_name {
                let msg:close_child_window_display = serde_json::from_str(txt.as_str())?;
                renderloop_send.send(RenderMessage::CloseChildWindow(msg));
                return Ok(())
            }
            if msg_type == DrawPixel_name {
                let msg:DrawPixel = serde_json::from_str(txt.as_str())?;
                renderloop_send.send(RenderMessage::DrawPixel(msg));
                return Ok(())
            }
            if msg_type == DrawRect_name {
                let msg:DrawRect = serde_json::from_str(txt.as_str())?;
                renderloop_send.send(RenderMessage::FillRect(msg));
                return Ok(())
            }
            match &msg_type[..] {
                "DRAW_IMAGE"   => {
                    let msg:DrawImageMessage = serde_json::from_str(txt.as_str())?;
                    renderloop_send.send(RenderMessage::DrawImage(msg));
                    ()
                },
                "WINDOW_CLOSE" => {
                    let msg:CloseWindowScreen = serde_json::from_str(txt.as_str())?;
                    renderloop_send.send(RenderMessage::CloseWindow(msg));
                    ()
                },
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
