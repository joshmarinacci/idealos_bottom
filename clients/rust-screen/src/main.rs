use std::sync::mpsc::{channel, Sender};
use std::thread;

use raylib::prelude::*;

use websocket::ClientBuilder;
use websocket::{Message, OwnedMessage};

use serde_json::{Result, Value, json};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;


#[derive(Serialize, Deserialize, Debug, Clone)]
struct Rect {
    x:i32,
    y:i32,
    width:i32,
    height:i32,
    color:String,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
struct Window {
    id:String,
    x:i32,
    y:i32,
    width:i32,
    height:i32,
    owner:String,
    rects:Vec<Rect>,
}


#[derive(Serialize, Deserialize, Debug)]
struct WindowListMessage  {
    #[serde(rename(deserialize = "type"))]
    type_:String,
    windows:HashMap<String,Window>,
}

#[derive(Debug)]
enum RenderMessage {
    WindowList(WindowListMessage),
    OpenWindow(OpenWindowScreen),
    DrawPixel(DrawPixelMessage),
    FillRect(FillRectMessage),
}


#[derive(Serialize, Deserialize, Debug)]
struct RefreshWindowMessage {
    #[serde(rename = "type")]
    type_:String,
    target:String,
    window:String,
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
struct OpenWindowScreen {
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



fn parse_message(sender:&Sender<OwnedMessage>,  renderloop_send:&Sender<RenderMessage>, txt:String) -> Result<()>{
    let v: Value = serde_json::from_str(txt.as_str())?;
    match &v["type"] {
        Value::String(strr) => {
            match &strr[..] {
                "WINDOW_LIST" => {
                    println!("got window message");
                    let msg:WindowListMessage = serde_json::from_str(txt.as_str())?;
                    renderloop_send.send(RenderMessage::WindowList(msg));
                    ()
                },// window_list(sender, renderloop_send, &serde_json::from_str(txt.as_str())?),
                "SCREEN_NAME" => {
                    let msg:OpenWindowScreen = serde_json::from_str(txt.as_str())?;
                    renderloop_send.send(RenderMessage::OpenWindow(msg));
                    ()
                    // screen_name(&serde_json::from_str(txt.as_str())?)
                },
                "DRAW_PIXEL"  => {
                    let msg:DrawPixelMessage = serde_json::from_str(txt.as_str())?;
                    renderloop_send.send(RenderMessage::DrawPixel(msg));
                    ()
                    // draw_pixel(&serde_json::from_str(txt.as_str())?)
                },
                "FILL_RECT"   => {
                    let msg:FillRectMessage = serde_json::from_str(txt.as_str())?;
                    renderloop_send.send(RenderMessage::FillRect(msg));
                    ()
                },
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

fn window_list(windows:&mut HashMap<String, Window>, sender:&Sender<OwnedMessage>, msg:&WindowListMessage) {
    println!("got window list {:?}",msg);
    for(key,value) in &msg.windows {
        println!("make window id {} at {},{}", value.id,value.x, value.y);
        windows.insert(key.clone(), value.clone());
    }
    println!("window count is {:?}",windows.len());
    for(_, win) in windows {
        println!("sending to window {}", win.id);
        let msg2 = RefreshWindowMessage {
            type_:"REFRESH_WINDOW".to_string(),
            target: win.owner.clone(),
            window:win.id.clone()
        };
        let val = json!(msg2);
        let txt = OwnedMessage::Text(val.to_string());
        sender.send(txt);
    }
}
fn screen_name(msg:&OpenWindowScreen) {
    println!("go screen name {:?}",msg)
}
fn draw_pixel(msg:&DrawPixelMessage) {
    println!("drawing pixel from {:?}",msg);
}
fn fill_rect(msg:&FillRectMessage) {
    println!("fill rect {:?}",msg);
}

fn main() {
    let mut windows:HashMap<String,Window> = HashMap::new();
    let mut colors:HashMap<String,Color> = HashMap::new();
    colors.insert("black".parse().unwrap(), Color::BLACK);
    colors.insert("red".parse().unwrap(), Color::RED);
    colors.insert("green".parse().unwrap(), Color::GREEN);
    colors.insert("skyblue".parse().unwrap(), Color::SKYBLUE);

    let border_color = "black";

    println!("Hello, world!");
    let name  = "ws://127.0.0.1:8081";
/*
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
    let (tx, websocket_sending_rx) = channel();
    let websocket_sending_tx = tx.clone();
    let (render_loop_send, render_loop_receive) = channel::<RenderMessage>();

    //loop for receiving
    let receive_loop = thread::spawn(move || {
        // Receive loop
        for message in receiver.incoming_messages() {
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
                    // println!("the text is {:?}",txt);
                    parse_message(&websocket_sending_tx, &render_loop_send, txt);
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
            let message = match websocket_sending_rx.recv() {
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
            println!("sending out {:?}",message);
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



    let (mut rl, thread) = raylib::init()
        .size(640, 480)
        .title(name)
        .build();
    rl.set_target_fps(5);
    while !rl.window_should_close() {
        // println!("rendering");
        //check messages
        match render_loop_receive.try_recv() {
            Ok(msg) => {
                // println!("the text is {:?}", msg);
                // println!("got render message {:?}",msg);
                match msg {
                    RenderMessage::OpenWindow(m) => {
                        println!("adding a window");
                        let win = m.window;
                        windows.insert(win.id.clone(),Window{
                            owner:win.owner,
                            id:win.id,
                            x:win.x,
                            y:win.y,
                            width:win.width,
                            height:win.height,
                            rects: vec![]
                        });
                    }
                    RenderMessage::WindowList(m) => {
                        for(key,value) in &m.windows {
                            println!("make window id {} at {},{}", value.id,value.x, value.y);
                            windows.insert(key.clone(), value.clone());
                        }
                        println!("window count is {:?}",windows.len());
                        send_refresh_all_windows_request(&windows, &tx);
                    },
                    RenderMessage::DrawPixel(m) =>{
                        //        win.rects.push({x:msg.x,y:msg.y,width:1,height:1,color:msg.color})
                        match windows.get_mut(m.window.as_str()) {
                            None => {
                                println!("no window found for {}",m.window.as_str())
                            }
                            Some(win) => {
                                // println!("adding a rect {:?}",m);
                                win.rects.push(Rect{
                                    x: m.x,
                                    y: m.y,
                                    width: 1,
                                    height: 1,
                                    color:m.color,
                                });
                            }
                        }
                    },
                    RenderMessage::FillRect(m) => {
                        if let Some(win) = windows.get_mut(m.window.as_str()) {
                            win.rects.push(Rect{
                                x: m.x,
                                y: m.y,
                                width: m.width,
                                height: m.height,
                                color: m.color,
                            })
                        }
                    }
                }
            },
            Err(e) => {
                // println!("nothing ready");
            }
        };

        //check input
        // let pressed_key = rl.get_key_pressed();
        // if let Some(pressed_key) = pressed_key {
        // Certain keyboards may have keys raylib does not expect. Uncomment this line if so.
        // let pressed_key: u32 = unsafe { std::mem::transmute(pressed_key) };
        //d.draw_text(&format!("{:?}", pressed_key), 100, 12, 10, Color::BLACK);
        // }
        //drawing
        let mut d = rl.begin_drawing(&thread);
        d.clear_background(Color::WHITE);
        // println!("window count is {:?}",windows.len());
        let scale = 10;

        for(_, win) in &windows {
            // println!("drawing window rects {}",win.rects.len());
            d.draw_rectangle(
                (win.x-1)*scale,
                    (win.y-1)*scale,
                (win.width+2)*scale,
                (win.height+2)*scale,
                Color::BLACK
            );
            for rect in &win.rects {
                // println!("drawing rect {:?}",rect);
                if let Some(color) = colors.get(rect.color.as_str()) {
                    d.draw_rectangle((win.x+rect.x)*scale,
                                     (win.y+rect.y)*scale,
                                     (rect.width*(scale-1)),
                                     (rect.height*(scale-1)),
                                     color)
                }

            }
        }
    }


        //wait for the end
    println!("Waiting for child threads to exit");

    let _ = send_loop.join();
    // let _ = receive_loop.join();

    println!("Exited");

}

fn send_refresh_all_windows_request(windows: &HashMap<String, Window>, sender:&Sender<OwnedMessage>) {
    println!("sending out full refresh request");
    for(_, win) in windows {
        println!("sending to window {}", win.id);
        let msg2 = RefreshWindowMessage {
            type_:"REFRESH_WINDOW".to_string(),
            target: win.owner.clone(),
            window:win.id.clone()
        };
        let val = json!(msg2);
        let txt = OwnedMessage::Text(val.to_string());
        sender.send(txt);
    }
}
