use std::collections::HashMap;
use std::f32::consts::PI;
use std::net::TcpStream;
use std::sync::mpsc::{channel, Receiver, Sender};
use std::thread;

use raylib::prelude::*;
use serde::{Deserialize, Serialize};
use serde_json::{json, Result, Value};
use websocket::{Message, OwnedMessage};
use websocket::ClientBuilder;
use websocket::receiver::Reader;
use websocket::sender::Writer;

use messages::{CloseWindowScreen, DrawImageMessage, DrawPixelMessage, FillRectMessage, MouseDownMessage, MouseUpMessage, OpenWindowScreen, RefreshWindowMessage, RenderMessage, WindowListMessage};
use window::{Point, Window};

use crate::incoming::process_incoming;
use crate::outgoing::process_outgoing;
use crate::backend::Backend;
use crate::raylib::RaylibBackend;

mod messages;
mod window;
mod incoming;
mod outgoing;
mod raylib;
mod backend;

const scale: i32 = 10;

fn main() {
    let mut windows:HashMap<String,Window> = HashMap::new();

    let mut active_window:Option<String> = Option::None;

    let name  = "ws://127.0.0.1:8081";
    let mut client = ClientBuilder::new(name)
        .unwrap()
        .connect_insecure()
        .unwrap();

    println!("we are connected now!");

    let (mut server_reader, mut server_sender) = client.split().unwrap();
    //create a channel
    let (tx, websocket_sending_rx) = channel();
    let websocket_sending_tx = tx.clone();
    let (render_loop_send, render_loop_receive) = channel::<RenderMessage>();

    //loop for receiving
    let receive_loop = thread::spawn(move || {
        process_incoming(&mut server_reader, &websocket_sending_tx, &render_loop_send);
    });

    //loop for sending
    let send_loop = thread::spawn(move || {
        process_outgoing(&websocket_sending_rx, &mut server_sender);
    });


    //send the initial connection message
    let message = OwnedMessage::Text("{\"type\":\"SCREEN_START\"}".to_string());
    match tx.send(message) {
        Ok(()) => (),
        Err(e) => {
            println!("error sending: {:?}", e);
        }
    }

    let backend:Backend = RaylibBackend::make(640,480,60);
    backend.start_loop(&mut windows, &render_loop_receive, &tx);

    let sender3 = tx.clone();
    while !rl.window_should_close() {
        // println!("scale is {:?}",&rl.get_window_scale_dpi());
        // println!("render");
        process_render_messages(&mut rl, &mut windows, &render_loop_receive, &tx, &colors, &thread);
        process_keyboard_input(&mut rl);
        process_mouse_input(&mut rl, &windows, &sender3, &mut active_window);
        let mut d = rl.begin_drawing(&thread);
        d.clear_background(Color::WHITE);
        process_render_drawing(&windows, &mut d, &colors, &active_window);
    }


        //wait for the end
    println!("Waiting for child threads to exit");

    let _ = send_loop.join();
    let _ = receive_loop.join();

    println!("Exited");

}

fn process_keyboard_input(rl: &mut RaylibHandle) {
    let pressed_key = rl.get_key_pressed();
    if let Some(pressed_key) = pressed_key {
        // println!("pressed key {:?}",pressed_key);
    // Certain keyboards may have keys raylib does not expect. Uncomment this line if so.
    // let pressed_key: u32 = unsafe { std::mem::transmute(pressed_key) };
    //d.draw_text(&format!("{:?}", pressed_key), 100, 12, 10, Color::BLACK);
    }
    if rl.is_key_down(KeyboardKey::KEY_RIGHT) {
        // println!("right is down")
    }

}
fn process_mouse_input(rl: &mut RaylibHandle, windows:&HashMap<String,Window>, websocket_sender:&Sender<OwnedMessage>, active:&mut Option<String>) {
    // println!("mouse position {:?}",rl.get_mouse_position());
    // println!("button pressed {:?}",rl.is_mouse_button_pressed(MouseButton::MOUSE_LEFT_BUTTON));
    if rl.is_mouse_button_pressed(MouseButton::MOUSE_LEFT_BUTTON) {
        let pos = rl.get_mouse_position();
        let pt = Point {
            x:(pos.x/scale as f32) as i32,
            y:(pos.y/scale as f32) as i32,
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
                // println!("sending mouse down {:?}",msg);
                websocket_sender.send(OwnedMessage::Text(json!(msg).to_string()));
            }
        }
    }

    if rl.is_mouse_button_released(MouseButton::MOUSE_LEFT_BUTTON) {
        let pos = rl.get_mouse_position();
        let pt = Point {
            x:(pos.x/scale as f32) as i32,
            y:(pos.y/scale as f32) as i32,
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

fn process_render_drawing(windows: &HashMap<String, Window>, d: &mut RaylibDrawHandle, colors: &HashMap<String,Color>, active_window:&Option<String>) {
    // println!("window count is {:?}",windows.len());

    for(_, win) in windows {
        //draw bg of window
        d.draw_rectangle(
            (win.x*scale-1*scale),
            (win.y*scale-1*scale),
            (win.width*scale+2*scale),
            (win.height*scale+2*scale),
            calc_window_background(win,active_window),
        );
        //draw window buffer
        let src = Rectangle{
            x: 0.0,
            y: 0.0,
            width: win.width as f32,
            height: -win.height as f32,
        };
        let dst = Rectangle {
            x: (win.x*scale) as f32,
            y: (win.y*scale) as f32,
            width: (win.width*scale) as f32 ,
            height: (win.height*scale) as f32,
        };
        let origin = rvec2(0,0);
        d.draw_texture_pro(&win.tex, src,dst,origin,0.0,Color::WHITE)
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

fn process_render_messages(mut rl: &mut RaylibHandle, windows:&mut HashMap<String,Window>, render_loop_receive:&Receiver<RenderMessage>, tx:&Sender<OwnedMessage>, colors: &HashMap<String,Color>, thread:&RaylibThread) {
    loop {
        match render_loop_receive.try_recv() {
            Ok(msg) => {
                // println!("the text is {:?}", msg);
                // println!("got render message {:?}",msg);
                match msg {
                    RenderMessage::OpenWindow(m) => {
                        println!("opening a window");
                        windows.insert(m.window.id.clone(), Window::from_info(rl, thread, &m.window));
                        println!("window count is {}", windows.len());
                    }
                    RenderMessage::CloseWindow(m) => {
                        println!("closing a window");
                        windows.remove(m.window.id.as_str());
                        println!("window count is {}", windows.len());
                        ()
                    }
                    RenderMessage::WindowList(m) => {
                        for (key, value) in &m.windows {
                            println!("make window id {} at {},{}", value.id, value.x, value.y);
                            windows.insert(key.clone(), Window::from_info(rl, thread, &value));
                        }
                        println!("window count is {:?}", windows.len());
                        send_refresh_all_windows_request(&windows, &tx);
                    },
                    RenderMessage::DrawPixel(m) => {
                        match windows.get_mut(m.window.as_str()) {
                            None => {
                                println!("no window found for {}", m.window.as_str())
                            }
                            Some(win) => {
                                if let Some(color) = colors.get(m.color.as_str()) {
                                    let mut d = rl.begin_texture_mode(thread, &mut *win.tex);
                                    d.draw_rectangle(m.x,m.y,1,1,color);
                                } else {
                                    println!("invalid color {}",m.color);
                                }
                            }
                        }
                    },
                    RenderMessage::DrawImage(m) => {
                        match windows.get_mut(m.window.as_str()) {
                            None => {
                                println!("no window found for {}", m.window.as_str())
                            }
                            Some(win) => {
                                // println!("drawing an image {}x{} at {},{}, len = {}",m.width,m.height,m.x,m.y,m.pixels.len());
                                let mut img = Image::gen_image_color(m.width, m.height, Color::WHITE);
                                for i in 0..m.width {
                                    for j in 0..m.height {
                                        let n = ((j*m.width+i)*4) as usize;
                                        let r = m.pixels[n+0] as u8;
                                        let g = m.pixels[n+1] as u8;
                                        let b = m.pixels[n+2] as u8;
                                        let a = m.pixels[n+3] as u8;
                                        let col = Color::from((r,g,b,a));
                                        // println!("at {},{} color is {:?}",i,j,col);
                                        img.draw_pixel(i,j,col);
                                    }
                                }
                                let tex = rl.load_texture_from_image(thread, &img).unwrap();
                                let mut d = rl.begin_texture_mode(thread, &mut *win.tex);
                                d.draw_texture(&tex,m.x,m.y, Color::WHITE);
                            }
                        }
                    },
                    RenderMessage::FillRect(m) => {
                        match windows.get_mut(m.window.as_str()) {
                            None => {
                                println!("no window found for {}", m.window.as_str())
                            }
                            Some(win) => {
                                if let Some(color) = colors.get(m.color.as_str()) {
                                    // println!("drawing a rect {}x{} at {},{}",m.width,m.height,m.x,m.y);
                                    let mut d = rl.begin_texture_mode(thread, &mut *win.tex);
                                    d.draw_rectangle(m.x,m.y,m.width,m.height,color);
                                } else {
                                    println!("invalid color {}",m.color);
                                }
                            }
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
            type_:"WINDOW_REFRESH".to_string(),
            target: win.owner.clone(),
            window:win.id.clone()
        };
        let val = json!(msg2);
        let txt = OwnedMessage::Text(val.to_string());
        sender.send(txt);
    }
}
