use std::sync::mpsc::channel;
use std::thread;

use websocket::ClientBuilder;
use websocket::{Message, OwnedMessage};

use serde_json::{Result, Value};
use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize, Debug)]
struct WindowListMessage {
    #[serde(rename(deserialize = "type"))]
    type_:String,
}

#[derive(Serialize, Deserialize, Debug)]
struct DrawPixelMessage {
    #[serde(rename(deserialize = "type"))]
    type_:String,
    color:String,
    window:String,
    x:i32,
    y:i32,
}

#[derive(Serialize, Deserialize, Debug)]
struct FillRectMessage {
    #[serde(rename(deserialize = "type"))]
    type_:String,
    color:String,
    window:String,
    x:i32,
    y:i32,
    width:i32,
    height:i32,
}

#[derive(Serialize, Deserialize, Debug)]
struct ScreenNameMessage {
    #[serde(rename(deserialize = "type"))]
    type_:String,
    target:String,
    window: WindowInfo,
}

#[derive(Serialize, Deserialize, Debug)]
struct WindowInfo {
    id:String,
    x:i32,
    y:i32,
    width:i32,
    height:i32,
    owner:String,
}

fn parse_message(txt:String) -> Result<()>{
    let v: Value = serde_json::from_str(txt.as_str())?;
    match &v["type"] {
        Value::String(strr) => {
            match &strr[..] {
                "WINDOW_LIST" => window_list(&serde_json::from_str(txt.as_str())?),
                "SCREEN_NAME" => screen_name(&serde_json::from_str(txt.as_str())?),
                "DRAW_PIXEL"  => draw_pixel(&serde_json::from_str(txt.as_str())?),
                "FILL_RECT"   => fill_rect(&serde_json::from_str(txt.as_str())?),
                _ => {
                    println!("some other message type")
                }
            }
        }
        _ => {
            println!("data that's not a message!!")
        }
    }
   Ok(())
}

fn window_list(msg:&WindowListMessage) {
    println!("got window list {:?}",msg)
}
fn screen_name(msg:&ScreenNameMessage) {
    println!("go screen name {:?}",msg)
}
fn draw_pixel(msg:&DrawPixelMessage) {
    println!("drawing pixel from {:?}",msg);
}
fn fill_rect(msg:&FillRectMessage) {
    println!("fill rect {:?}",msg);
}

fn main() {
    println!("Hello, world!");
    let name  = "ws://127.0.0.1:8081";
/*
 connect to the server
 once open, send a screen start message
 wait for incoming messages.
 if incoming is open_window allocate a window
 if incoming is window list, refresh the windows by sending refresh_window to each one
 if incoming is draw pixel, draw it
 if incoming is fill rect, draw it
 */



    let mut client = ClientBuilder::new(name)
        .unwrap()
        .connect_insecure()
        .unwrap();

    println!("we are connected now!");

    let (mut receiver, mut sender) = client.split().unwrap();
    //create a channel
    let (tx, rx) = channel();
    let tx_1 = tx.clone();

    //loop for receiving
    let receive_loop = thread::spawn(move || {
        // Receive loop
        for message in receiver.incoming_messages() {
            let message = match message {
                Ok(m) => m,
                Err(e) => {
                    println!("Receive Loop: {:?}", e);
                    let _ = tx_1.send(OwnedMessage::Close(None));
                    return;
                }
            };
            match message {
                OwnedMessage::Close(_) => {
                    println!("got a close message");
                    // Got a close message, so send a close message and return
                    let _ = tx_1.send(OwnedMessage::Close(None));
                    return;
                    // Ok(());
                }
                /*
                OwnedMessage::Ping(data) => {
                    match tx_1.send(OwnedMessage::Pong(data)) {
                        // Send a pong in response
                        Ok(()) => (),
                        Err(e) => {
                            println!("Receive Loop: {:?}", e);
                            return;
                        }
                    }
                }*/
                // Say what we received
                OwnedMessage::Text(txt) => {
                    // println!("the text is {:?}",txt);
                    parse_message(txt);
                }
                _ => {
                    println!("Receive Loop: {:?}", message);
                },
            }
        }
    });


    //loop for sending
    let send_loop = thread::spawn(move || {
        loop {
            // Send loop
            let message = match rx.recv() {
                Ok(m) => m,
                Err(e) => {
                    println!("Send Loop: {:?}", e);
                    return;
                }
            };
            println!("got a message to send out");
            match message {
                OwnedMessage::Close(_) => {
                    let _ = sender.send_message(&message);
                    // If it's a close message, just send it and then return.
                    return;
                }
                _ => (),
            }
            // Send the message
            match sender.send_message(&message) {
                Ok(()) => (),
                Err(e) => {
                    println!("Send Loop: {:?}", e);
                    let _ = sender.send_message(&Message::close());
                    return;
                }
            }
        }
    });


    //send the initial connection message
    let message = OwnedMessage::Text("{\"type\":\"START\"}".to_string());
    match tx.send(message) {
        Ok(()) => (),
        Err(e) => {
            println!("error sending: {:?}", e);
        }
    }

    //wait for the end
    println!("Waiting for child threads to exit");

    let _ = send_loop.join();
    let _ = receive_loop.join();

    println!("Exited");

}
