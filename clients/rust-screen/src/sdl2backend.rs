use std::time::Duration;
use std::sync::mpsc::{Sender, Receiver};
use std::collections::HashMap;
use websocket::OwnedMessage;
use serde_json::{json};

use crate::window::{Window, Point};
use crate::messages::{RenderMessage, MouseDownMessage, MouseUpMessage};
use crate::backend::Backend;


use sdl2::event::Event;
use sdl2::keyboard::Keycode;
use sdl2::pixels::{Color, PixelFormatEnum};
use sdl2::render::{WindowCanvas, Texture, TextureCreator};
use sdl2::Sdl;
use crate::common::send_refresh_all_windows_request;
use sdl2::video::WindowContext;
use sdl2::video::Window as SDLWindow;
use std::cell::RefCell;
use sdl2::rect::Rect;
use sdl2::audio::AudioFormat::S8;
use Event::MouseButtonDown;
use sdl2::mouse::MouseButton;
use std::cmp::{max, min};
use sdl2::controller::Button::B;


const SCALE: u32 = 5;
const SCALEI: i32 = SCALE as i32;
const BORDER: i32 = 1;

pub struct SDL2Backend<'a> {
    pub active_window:Option<String>,
    pub sdl_context: &'a Sdl,
    pub canvas: WindowCanvas,
    pub creator: &'a TextureCreator<WindowContext>,
    pub window_buffers:HashMap<String,Texture<'a>>,
}

impl<'a> SDL2Backend<'a> {
    // pub fn make(canvas:WindowCanvas, creator:&'a TextureCreator<WindowContext>) -> Result<SDL2Backend<'a>,String> {
    //     // let tex = creator.create_texture_target(PixelFormatEnum::RGBA8888, 20,20)
    //     //     .map_err(|e|e.to_string()).unwrap();
    //     Ok(SDL2Backend {
    //         // window,
    //         // sdl_context,
    //         // canvas: canvas,
    //         active_window: Option::None,
    //         creator: &creator,
    //         // window_buffers:tex,
    //         window_buffers: Default::default()
    //     })
    // }

    fn process_render_messages(&mut self,
                               windows:&mut HashMap<String, Window>,
                               input: &Receiver<RenderMessage>,
                               output: &Sender<OwnedMessage>,
                               // creator:&TextureCreator<WindowContext>,
                               // window_buffers:&mut HashMap<String,Texture>
    ) {
        'main: loop {
            match input.try_recv() {
                Ok(msg) => {
                    match msg {
                        RenderMessage::OpenWindow(m) => {
                            println!("opening a window");
                            let win = Window::from_info(&m.window);
                            self.init_window(&win);
                            // self.window_buffers.insert(win.id.clone(),win);
                            windows.insert(m.window.id.clone(), win);
                            println!("window count is {}", windows.len());
                        }
                        RenderMessage::WindowList(m) => {
                            for (key, value) in &m.windows {
                                println!("make window id {} at {},{}", value.id, value.x, value.y);
                                let win = Window::from_info(&value);
                                self.init_window(&win);
                                windows.insert(win.id.clone(), win);
                            }
                            println!("window count is {:?}", windows.len());
                            send_refresh_all_windows_request(&windows, &output);
                        },
                        RenderMessage::DrawPixel(m) => {
                            if let Some(win) = windows.get_mut(m.window.as_str()) {
                                if let Some(tex) = self.window_buffers.get_mut(win.id.as_str()) {
                                    self.canvas.with_texture_canvas(tex, |texture_canvas| {
                                        texture_canvas.set_draw_color(lookup_color(&m.color));
                                        texture_canvas
                                            .fill_rect(Rect::new(m.x*SCALEI,
                                                                 m.y*SCALEI, SCALE, SCALE))
                                            .expect("could not fill rect");
                                        println!("drew pixel to texture at {},{} c={}",m.x,m.y, m.color);
                                    });
                                }
                            }
                        },
                        RenderMessage::FillRect(m) => {
                            if let Some(win) = windows.get_mut(m.window.as_str()) {
                                if let Some(tex) = self.window_buffers.get_mut(win.id.as_str()) {
                                    self.canvas.with_texture_canvas(tex, |texture_canvas| {
                                        texture_canvas.set_draw_color(lookup_color(&m.color));
                                        texture_canvas
                                            .fill_rect(Rect::new(m.x*SCALEI, m.y*SCALEI, (m.width*SCALEI) as u32, (m.height*SCALEI) as u32))
                                            .expect("could not fill rect");
                                        println!("drew rect to texture at {},{} - {}x{}",m.x,m.y,m.width,m.height);
                                    });
                                }
                            }
                        }
                        RenderMessage::DrawImage(m) => {
                            if let Some(win) = windows.get_mut(m.window.as_str()) {
                                if let Some(tex) = self.window_buffers.get_mut(win.id.as_str()) {
                                    println!("drawing an image {}x{}", m.width, m.height);
                                    tex.update(Rect::new(m.x, m.y, m.width as u32, m.height as u32), &*m.pixels, (4 * m.width) as usize);
                                }
                            }
                        }
                        _ => {
                            println!("unhandled message {:?}",msg);
                        }
                    }
                }
                Err(e) => break
            }
        }
    }
    fn init_window(&mut self, win: &Window) {
        let mut tex = self.creator.create_texture_target(PixelFormatEnum::RGBA8888,
                                                         (win.width as u32)*SCALE,
                                                         (win.height as u32)*SCALE
                                                         // 256,256
        )
            .map_err(|e|e.to_string()).unwrap();
        println!("made texture {}x{}",win.width, win.height);
        self.canvas.with_texture_canvas(&mut tex, |tc|{
            tc.clear();
            tc.set_draw_color(Color::RGBA(0,0,0,255));
            tc
                .fill_rect(Rect::new(0, 0, (win.width as u32*SCALE) as u32, (win.height as u32*SCALE) as u32));
        });
        self.window_buffers.insert(win.id.clone(),tex);
    }

    pub fn start_loop(&mut self,
                      windows: &mut HashMap<String, Window>,
                      input: &Receiver<RenderMessage>,
                      output: &Sender<OwnedMessage>
) -> Result<(),String> {

        let mut event_pump = self.sdl_context.event_pump()?;

        'done:loop {
            for event in event_pump.poll_iter() {
                match event {
                    Event::Quit { .. }
                    | Event::KeyDown {
                        keycode: Some(Keycode::Escape),
                        ..
                    } => {
                        println!("quitting");
                        break 'done;
                    },
                    Event::KeyDown {keycode,..} => self.process_keydown(keycode, windows),
                    Event::MouseButtonDown { x, y,mouse_btn, .. } => self.process_mousedown(x,y,mouse_btn, windows, output),
                    Event::MouseButtonUp {x,y,mouse_btn,..} =>  self.process_mouseup(x,y,mouse_btn,windows,output),
                    _ => {}
                }
            }

            self.process_render_messages(windows,
                                         input,
                                         output,
            );
            self.process_render_drawing(windows);
            ::std::thread::sleep(Duration::new(0, 1_000_000_000u32 / 30));
        }
        println!("SDL thread is ending");

        Ok(())
    }
    fn process_render_drawing(&mut self, windows: &mut HashMap<String, Window>) {
        self.canvas.set_draw_color(Color::RGBA(255,0,255,255));
        self.canvas.clear();
        //clear background to white
        //for each window
        for(id,win) in windows {
            if let Some(tex) = self.window_buffers.get(id) {
                //draw background / border
                self.canvas.set_draw_color(self.calc_window_border_color(win));
                self.canvas.fill_rect(Rect::new(
                    ((win.x-BORDER)*(SCALE as i32)) as i32,
                    ((win.y-BORDER)*(SCALE as i32)) as i32,
                    (win.width+BORDER+BORDER)as u32*SCALE as u32,
                    (win.height+BORDER+BORDER)as u32*SCALE as u32));
                //draw window texture
                let dst = Some(Rect::new((win.x as u32*SCALE) as i32,
                                         (win.y as u32*SCALE) as i32,
                                         (win.width as u32 * SCALE as u32) as u32,
                                         (win.height as u32 * SCALE as u32) as u32
                ));
                self.canvas.copy(tex,None,dst);
                // println!("drawing window at {:?}",dst);
            }
        }
        self.canvas.present();
    }
    fn process_keydown(&self, keycode: Option<Keycode>, windows:&mut HashMap<String,Window>) {
        if let Some(keycode) = keycode {
            // println!("keycode pressed {}",keycode);
            match keycode {
                Keycode::Right => {
                    if let Some(id) = &self.active_window {
                        if let Some(win) = windows.get_mut(id) {
                            win.x = min(    win.x+5,100);
                        }
                    }
                }
                Keycode::Left => {
                    if let Some(id) = &self.active_window {
                        if let Some(win) = windows.get_mut(id) {
                            win.x = max(win.x-5,BORDER);
                        }
                    }
                }
                Keycode::Up => {
                    if let Some(id) = &self.active_window {
                        if let Some(win) = windows.get_mut(id) {
                            win.y = max(win.y-5,BORDER);
                        }
                    }
                }
                Keycode::Down => {
                    if let Some(id) = &self.active_window {
                        if let Some(win) = windows.get_mut(id) {
                            win.y = min(win.y+5,100);
                        }
                    }
                }
                _ => {

                }
            }
        }

    }
    fn process_mousedown(&mut self, x: i32, y: i32, mouse_btn: MouseButton, windows: &mut HashMap<String, Window>, output: &Sender<OwnedMessage>) {
        match mouse_btn {
            MouseButton::Left => {
                let pt = Point { x: x / SCALE as i32, y: y / SCALE as i32, };
                for win in windows.values() {
                    if win.contains(&pt) {
                        self.active_window = Some(win.id.clone());
                        let msg = MouseDownMessage {
                            type_: "MOUSE_DOWN".to_string(),
                            x: (pt.x) - win.x,
                            y: (pt.y) - win.y,
                            target: win.owner.clone()
                        };
                        output.send(OwnedMessage::Text(json!(msg).to_string()));
                    }
                }
            }
            _ => {}
        };

    }
    fn process_mouseup(&self, x: i32, y: i32, mouse_btn: MouseButton, windows: &mut HashMap<String, Window>, output: &Sender<OwnedMessage>) {
        if let MouseButton::Left = mouse_btn {
            let pt = Point { x: x / SCALE as i32, y: y / SCALE as i32, };
            if let Some(id) = &self.active_window {
                if let Some(win) = windows.get(id) {
                    let msg = MouseUpMessage {
                        type_: "MOUSE_UP".to_string(),
                        x: (pt.x) - win.x,
                        y: (pt.y) - win.y,
                        target: win.owner.clone()
                    };
                    output.send(OwnedMessage::Text(json!(msg).to_string()));
                }
            }
        }

    }
    fn calc_window_border_color(&self, win: &mut Window) -> Color {
        return if self.active_window == Some(win.id.clone()) {
            Color::RGBA(0, 255, 255, 255)
        } else {
            Color::RGBA(255, 255, 0, 255)
        }
    }
}

fn lookup_color(name: &String) -> Color {
    return match name.as_str() {
        "red" => Color::RED,
        "black" => Color::BLACK,
        "blue" => Color::BLUE,
        "white" => Color::WHITE,
        "green" => Color::GREEN,
        _ => {
            println!("unknown color {}",name);
            Color::MAGENTA
        },
    }
}


