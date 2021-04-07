use std::sync::mpsc::{channel, Sender, Receiver};
use std::thread;

use raylib::prelude::*;

use websocket::ClientBuilder;
use websocket::{Message, OwnedMessage};

use serde_json::{Result, Value, json};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use websocket::receiver::Reader;
use std::net::TcpStream;
use websocket::sender::Writer;

const scale: f32 = 5.0;


#[derive(Serialize, Deserialize, Debug, Clone)]
struct Rect {
    x:i32,
    y:i32,
    width:i32,
    height:i32,
    color:String,
}


#[derive(Serialize, Deserialize, Debug, Clone)]
struct Point {
    x:i32,
    y:i32,
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
impl Window {
    fn contains(&self, pt:&Point) -> bool {
        if pt.x < self.x { return false; }
        if pt.x > (self.x + self.width) { return false; }
        if pt.y < self.y { return false; }
        if pt.y > (self.y + self.height) { return false; }
        return true
    }
}


#[derive(Serialize, Deserialize, Debug)]
struct WindowListMessage  {
    #[serde(rename = "type")]
    type_:String,
    windows:HashMap<String,Window>,
}

#[derive(Debug)]
enum RenderMessage {
    WindowList(WindowListMessage),
    OpenWindow(OpenWindowScreen),
    CloseWindow(CloseWindowScreen),
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
struct MouseDownMessage {
    #[serde(rename = "type")]
    type_:String,
    target:String,
    x:i32,
    y:i32,
}

#[derive(Serialize, Deserialize, Debug)]
struct MouseUpMessage {
    #[serde(rename = "type")]
    type_:String,
    target:String,
    x:i32,
    y:i32,
}


#[derive(Serialize, Deserialize, Debug)]
struct DrawPixelMessage {
    #[serde(rename = "type")]
    type_:String,
    color:String,
    window:String,
    x:i32,
    y:i32,
}

#[derive(Serialize, Deserialize, Debug)]
struct FillRectMessage {
    #[serde(rename = "type")]
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
    #[serde(rename = "type")]
    type_:String,
    target:String,
    window: WindowInfo,
}

#[derive(Serialize, Deserialize, Debug)]
struct CloseWindowScreen {
    #[serde(rename = "type")]
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
                    let msg:WindowListMessage = serde_json::from_str(txt.as_str())?;
                    renderloop_send.send(RenderMessage::WindowList(msg));
                    ()
                },
                "SCREEN_NAME" => {
                    let msg:OpenWindowScreen = serde_json::from_str(txt.as_str())?;
                    renderloop_send.send(RenderMessage::OpenWindow(msg));
                    ()
                },
                "DRAW_PIXEL"  => {
                    let msg:DrawPixelMessage = serde_json::from_str(txt.as_str())?;
                    renderloop_send.send(RenderMessage::DrawPixel(msg));
                    ()
                },
                "FILL_RECT"   => {
                    let msg:FillRectMessage = serde_json::from_str(txt.as_str())?;
                    renderloop_send.send(RenderMessage::FillRect(msg));
                    ()
                },
                "WINDOW_CLOSED" => {
                    let msg:CloseWindowScreen = serde_json::from_str(txt.as_str())?;
                    renderloop_send.send(RenderMessage::CloseWindow(msg));
                    ()
                }
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
    colors.insert("white".parse().unwrap(), Color::WHITE);
    colors.insert("red".parse().unwrap(), Color::RED);
    colors.insert("green".parse().unwrap(), Color::GREEN);
    colors.insert("skyblue".parse().unwrap(), Color::SKYBLUE);
    colors.insert("blue".parse().unwrap(), Color::BLUE);

    let mut active_window:Option<String> = Option::None;

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
    let receive_loop = thread::spawn(move || {  process_incoming_server_messages(&mut receiver, &websocket_sending_tx, &render_loop_send);  });


    //loop for sending
    let send_loop = thread::spawn(move || {
        process_outgoing_server_messages(&websocket_sending_rx,&mut sender);
    });


    //send the initial connection message
    let message = OwnedMessage::Text("{\"type\":\"START\"}".to_string());
    match tx.send(message) {
        Ok(()) => (),
        Err(e) => {
            println!("error sending: {:?}", e);
        }
    }



    // open window
    let (mut rl, thread) = raylib::init()
        .size(640, 480)
        .title(name)
        .build();
    rl.set_target_fps(10);
    let sender3 = tx.clone();
    while !rl.window_should_close() {
        // println!("render");
        process_render_messages(&mut windows, &render_loop_receive, &tx);
        process_keyboard_input(&mut rl);
        process_mouse_input(&mut rl, &windows, &sender3, &mut active_window);
        let mut d = rl.begin_drawing(&thread);
        d.clear_background(Color::WHITE);
        process_render_drawing(&windows, &mut d, &colors, &active_window);
    }


        //wait for the end
    println!("Waiting for child threads to exit");

    let _ = send_loop.join();
    // let _ = receive_loop.join();

    println!("Exited");

}

fn process_keyboard_input(rl: &mut RaylibHandle) {
    let pressed_key = rl.get_key_pressed();
    if let Some(pressed_key) = pressed_key {
        println!("pressed key {:?}",pressed_key);
    // Certain keyboards may have keys raylib does not expect. Uncomment this line if so.
    // let pressed_key: u32 = unsafe { std::mem::transmute(pressed_key) };
    //d.draw_text(&format!("{:?}", pressed_key), 100, 12, 10, Color::BLACK);
    }
    if rl.is_key_down(KeyboardKey::KEY_RIGHT) {
        // println!("right is down")
    }

}
fn process_mouse_input(rl: &mut RaylibHandle, windows:&HashMap<String,Window>, websocket_sender:&Sender<OwnedMessage>, active:&mut Option<String>) {
    // println!("mouse position {:?}",pos);
    if rl.is_mouse_button_pressed(MouseButton::MOUSE_LEFT_BUTTON) {
        let pos = rl.get_mouse_position();
        let pt = Point {
            x:(pos.x/scale) as i32,
            y:(pos.y/scale) as i32,
        };

        for win in windows.values() {
            if win.contains(&pt) {
                //win.set_active_window()
                *active = Some(win.id.clone());
                let msg = MouseDownMessage {
                    type_:"MOUSE_DOWN".to_string(),
                    x:(pt.x)-win.x,
                    y:(pt.y)-win.y,
                    target:win.owner.clone()
                };
                websocket_sender.send(OwnedMessage::Text(json!(msg).to_string()));
            }
        }
    }

    if rl.is_mouse_button_released(MouseButton::MOUSE_LEFT_BUTTON) {
        let pos = rl.get_mouse_position();
        let pt = Point {
            x:(pos.x/scale) as i32,
            y:(pos.y/scale) as i32,
        };

        for win in windows.values() {
            if win.contains(&pt) {
                let msg = MouseUpMessage {
                    type_:"MOUSE_UP".to_string(),
                    x:(pt.x)-win.x,
                    y:(pt.y)-win.y,
                    target:win.owner.clone()
                };
                websocket_sender.send(OwnedMessage::Text(json!(msg).to_string()));
            }
        }
    }
}

fn process_outgoing_server_messages(websocket_sending_rx: &Receiver<OwnedMessage>, sender: &mut Writer<TcpStream>) {
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

}

fn process_incoming_server_messages(receiver: &mut Reader<TcpStream>, websocket_sending_tx: &Sender<OwnedMessage>, render_loop_send: &Sender<RenderMessage>) {
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
                parse_message(websocket_sending_tx, render_loop_send, txt);
            }
            _ => {
                println!("Receive Loop: {:?}", message);
            },
        }
    }

}

fn process_render_drawing(windows: &HashMap<String, Window>, d: &mut RaylibDrawHandle, colors: &HashMap<String,Color>, active_window:&Option<String>) {
    // println!("window count is {:?}",windows.len());

    for(_, win) in windows {
        d.draw_rectangle(
            (win.x-1)*(scale as i32),
            (win.y-1)*(scale as i32),
            (win.width+2)*(scale as i32),
            (win.height+2)*(scale as i32),
            calc_window_background(win,active_window),
        );
        for rect in &win.rects {
            // println!("drawing rect {:?}",rect);
            if let Some(color) = colors.get(rect.color.as_str()) {
                d.draw_rectangle((win.x+rect.x)*(scale as i32),
                                 (win.y+rect.y)*(scale as i32),
                                 (rect.width*((scale-1.0) as i32)),
                                 (rect.height*((scale-1.0) as i32)),
                                 color)
            }
            if let None = colors.get(rect.color.as_str()) {
                println!("invalid color {}",rect.color);
            }

        }
    }
}

fn calc_window_background(win: &Window, active_window: &Option<String>) -> Color {
    match active_window {
        Some(id) => {
            if(id.eq(&win.id)) {
                Color::SKYBLUE
            } else {
                Color::BLACK
            }
        },
        None => Color::BLACK
    }
}

fn process_render_messages(windows:&mut HashMap<String,Window>, render_loop_receive:&Receiver<RenderMessage>, tx:&Sender<OwnedMessage>) {
    loop {
        match render_loop_receive.try_recv() {
            Ok(msg) => {
                // println!("the text is {:?}", msg);
                // println!("got render message {:?}",msg);
                match msg {
                    RenderMessage::OpenWindow(m) => {
                        println!("opening a window");
                        let win = m.window;
                        windows.insert(win.id.clone(), Window {
                            owner: win.owner,
                            id: win.id,
                            x: win.x,
                            y: win.y,
                            width: win.width,
                            height: win.height,
                            rects: vec![]
                        });
                        println!("window count is {}", windows.len());
                    }
                    RenderMessage::CloseWindow(m) => {
                        println!("closing a window");
                        let win = m.window;
                        windows.remove(win.id.as_str());
                        println!("window count is {}", windows.len());
                        ()
                    }
                    RenderMessage::WindowList(m) => {
                        for (key, value) in &m.windows {
                            println!("make window id {} at {},{}", value.id, value.x, value.y);
                            windows.insert(key.clone(), value.clone());
                        }
                        println!("window count is {:?}", windows.len());
                        send_refresh_all_windows_request(&windows, &tx);
                    },
                    RenderMessage::DrawPixel(m) => {
                        //        win.rects.push({x:msg.x,y:msg.y,width:1,height:1,color:msg.color})
                        match windows.get_mut(m.window.as_str()) {
                            None => {
                                println!("no window found for {}", m.window.as_str())
                            }
                            Some(win) => {
                                // println!("adding a rect {:?}",m);
                                win.rects.push(Rect {
                                    x: m.x,
                                    y: m.y,
                                    width: 1,
                                    height: 1,
                                    color: m.color,
                                });
                            }
                        }
                    },
                    RenderMessage::FillRect(m) => {
                        if let Some(win) = windows.get_mut(m.window.as_str()) {
                            win.rects.push(Rect {
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
                break;
            }
        }
    }

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
