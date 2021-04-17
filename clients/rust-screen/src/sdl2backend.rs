use std::time::Duration;
use std::sync::mpsc::{Sender, Receiver};
use std::collections::HashMap;
use websocket::OwnedMessage;
use serde_json::{json};

use crate::window::{Window, Point, Insets};
use crate::messages::{RenderMessage, MouseDownMessage, MouseUpMessage, KeyboardDownMessage};
use crate::fontinfo::FontInfo;


use sdl2::event::Event;
use sdl2::keyboard::Keycode;
use sdl2::pixels::{Color, PixelFormatEnum};
use sdl2::render::{WindowCanvas, Texture, TextureCreator};
use sdl2::Sdl;
use crate::common::send_refresh_all_windows_request;
use sdl2::video::WindowContext;
use sdl2::rect::Rect;
use sdl2::mouse::{MouseButton, MouseState};
use colors_transform::{Rgb, Color as CTColor};


const SCALE: u32 = 5;
const SCALEI: i32 = SCALE as i32;
const BORDER:Insets = Insets {
    left: 3,
    right: 3,
    top: 10,
    bottom: 3
};

pub struct SDL2Backend<'a> {
    pub active_window:Option<String>,
    pub sdl_context: &'a Sdl,
    pub canvas: WindowCanvas,
    pub creator: &'a TextureCreator<WindowContext>,
    pub window_buffers:HashMap<String,Texture<'a>>,
    pub dragging:bool,
    pub dragtarget:Option<String>,
    pub font:FontInfo<'a>,
}


impl<'a> SDL2Backend<'a> {
    fn process_render_messages(&mut self,
                               windows:&mut HashMap<String, Window>,
                               input: &Receiver<RenderMessage>,
                               output: &Sender<OwnedMessage>,
    ) {
        'main: loop {
            match input.try_recv() {
                Ok(msg) => {
                    match msg {
                        RenderMessage::OpenWindow(m) => {
                            // println!("opening a window");
                            let win = Window::from_info(&m.window);
                            self.init_window(&win);
                            // self.window_buffers.insert(win.id.clone(),win);
                            windows.insert(m.window.id.clone(), win);
                            // println!("window count is {}", windows.len());
                        }
                        RenderMessage::WindowList(m) => {
                            for (key, value) in &m.windows {
                                // println!("make window id {} at {},{}", value.id, value.x, value.y);
                                let win = Window::from_info(&value);
                                self.init_window(&win);
                                windows.insert(win.id.clone(), win);
                            }
                            println!("window count is {:?}", windows.len());
                            send_refresh_all_windows_request(&windows, &output);
                        },
                        RenderMessage::CloseWindow(m) => {
                            // println!("closing a window {:?}",m);
                            if let Some(win) = windows.get_mut(m.window.id.as_str()) {
                                self.close_window(win);
                                windows.remove(m.window.id.as_str());
                            }
                        },
                        RenderMessage::DrawPixel(m) => {
                            if let Some(win) = windows.get_mut(m.window.as_str()) {
                                if let Some(tex) = self.window_buffers.get_mut(win.id.as_str()) {
                                    self.canvas.with_texture_canvas(tex, |texture_canvas| {
                                        texture_canvas.set_draw_color(lookup_color(&m.color));
                                        texture_canvas
                                            .fill_rect(Rect::new(m.x,
                                                                 m.y, 1, 1))
                                            .expect("could not fill rect");
                                        // println!("drew pixel to texture at {},{} c={}",m.x,m.y, m.color);
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
                                            .fill_rect(Rect::new(m.x, m.y, m.width as u32, m.height as u32))
                                            .expect("could not fill rect");
                                        println!("drew rect to texture at {},{} - {}x{}",m.x,m.y,m.width,m.height);
                                    });
                                }
                            }
                        }
                        RenderMessage::DrawImage(m) => {
                            if let Some(win) = windows.get_mut(m.window.as_str()) {
                                if let Some(tex) = self.window_buffers.get_mut(win.id.as_str()) {
                                    // println!("drawing an image {}x{}", m.width, m.height);
                                    self.canvas.with_texture_canvas(tex,|texture_canvas|{
                                        // println!("drew image to texture at {},{} - {}x{}, count={}",m.x,m.y,m.width,m.height,m.pixels.len());
                                        for i in 0..m.width {
                                            for j in 0..m.height {
                                                let n:usize = ((j * m.width + i) * 4) as usize;
                                                let alpha = m.pixels[n+3];
                                                if alpha > 0 {
                                                    let col = Color::RGBA(m.pixels[n + 0], m.pixels[n + 1], m.pixels[n + 2], m.pixels[n + 3]);
                                                    texture_canvas.set_draw_color(col);
                                                    texture_canvas.fill_rect(Rect::new(m.x+i, m.y+j, 1, 1));
                                                }
                                            }
                                        }
                                    });
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
                                                         win.width as u32,
                                                         win.height as u32
                                                         // 256,256
        )
            .map_err(|e|e.to_string()).unwrap();
        println!("made texture {}x{}",win.width, win.height);
        self.canvas.with_texture_canvas(&mut tex, |tc|{
            tc.clear();
            tc.set_draw_color(Color::RGBA(0,0,0,255));
            tc
                .fill_rect(Rect::new(0, 0, (win.width as u32) as u32, (win.height as u32) as u32));
        });
        self.window_buffers.insert(win.id.clone(),tex);
    }
    fn close_window(&mut self, win: &mut Window) {
        // println!("found texture for window");
        //destroy the texture
        //remove from window_buffers
        self.window_buffers.remove(win.id.as_str());
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
                    Event::KeyDown {keycode,..} => self.process_keydown(keycode, windows,output),
                    Event::MouseButtonDown { x, y,mouse_btn, .. } => self.process_mousedown(x,y,mouse_btn, windows, output),
                    Event::MouseButtonUp {x,y,mouse_btn,..} =>  self.process_mouseup(x,y,mouse_btn,windows,output),
                    _ => {}
                }
            }
            self.process_mousedrag(&event_pump.mouse_state(), windows);

            self.process_render_messages(windows,
                                         input,
                                         output,
            );
            self.draw_windows(windows);
            ::std::thread::sleep(Duration::new(0, 1_000_000_000u32 / 60));
        }
        println!("SDL thread is ending");

        Ok(())
    }
    fn draw_windows(&mut self, windows: &mut HashMap<String, Window>) {
        self.canvas.set_draw_color(Color::RGBA(255,0,255,255));
        self.canvas.clear();
        //clear background to white
        //for each window
        for(id,win) in windows {
            if let Some(tex) = self.window_buffers.get(id) {
                //draw background / border
                match win.window_type.as_str() {
                    "menubar" => {
                        //
                    }
                    "plain" => {
                        self.canvas.set_draw_color(self.calc_window_border_color(win));
                        self.canvas.fill_rect(Rect::new(
                            ((win.x-BORDER.left)*(SCALE as i32)) as i32,
                            ((win.y-BORDER.top)*(SCALE as i32)) as i32,
                            (BORDER.left+win.width+BORDER.right)as u32*SCALE as u32,
                            (BORDER.top+win.height+BORDER.bottom)as u32*SCALE as u32));
                        self.font.draw_text_at(&*win.id,
                                               win.x,
                                               win.y-8,
                                               &Color::GREEN, &mut self.canvas, SCALEI);
                    },
                    _ => {}
                }
                //draw window texture
                let dst = Some(Rect::new((win.x as u32*SCALE) as i32,
                                         (win.y as u32*SCALE) as i32,
                                         (win.width as u32 * SCALE as u32) as u32,
                                         (win.height as u32 * SCALE as u32) as u32
                ));
                self.canvas.copy(tex,None,dst);
            }
        }
        self.font.draw_text_at("idealos", 150,0,&Color::GREEN, &mut self.canvas, SCALEI);
        self.canvas.present();
    }
    fn process_keydown(&self, keycode: Option<Keycode>, windows:&mut HashMap<String,Window>, output: &Sender<OwnedMessage>) {
        if let Some(keycode) = keycode {
            match keycode {
                Keycode => {
                    if let Some(id) = &self.active_window {
                        if let Some(win) = windows.get_mut(id) {
                            // println!("got a message {:?}",keycode.name());
                            let msg = KeyboardDownMessage {
                                type_: "KEYBOARD_DOWN".to_string(),
                                keyname: keycode.name(),
                                target: win.owner.clone()
                            };
                            output.send(OwnedMessage::Text(json!(msg).to_string()));
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
                        continue;
                    }
                    if win.border_contains(&pt, &BORDER) {
                        // println!("clicked on the border");
                        self.dragging = true;
                        self.dragtarget = Some(win.id.clone());
                    }
                }
            }
            _ => {}
        };

    }
    fn process_mouseup(&mut self, x: i32, y: i32, mouse_btn: MouseButton, windows: &mut HashMap<String, Window>, output: &Sender<OwnedMessage>) {
        self.dragging = false;
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
    fn process_mousedrag(&self, mouse_state:&MouseState, windows:&mut HashMap<String,Window>) -> () {
        if !self.dragging { return };
        if let Some(winid) = &self.dragtarget {
            if let Some(win) = windows.get_mut(winid) {
                // println!("dragging {} {} with {:?}", mouse_state.x(), mouse_state.y(), win.id);
                win.x = mouse_state.x()/SCALEI;
                win.y = mouse_state.y()/SCALEI;
            }
        }
    }
}

fn lookup_color(name: &String) -> Color {
    if name.starts_with("#") {
        // println!("its hex");
        let col = Rgb::from_hex_str(name).unwrap();
        // println!("parsed the color ${:?}",col);
        return Color::RGBA(col.get_red() as u8, col.get_green() as u8, col.get_blue() as u8, 255);
    }
    return match name.as_str() {
        "red" => Color::RED,
        "black" => Color::BLACK,
        "blue" => Color::BLUE,
        "white" => Color::WHITE,
        "green" => Color::GREEN,
        "yellow" => Color::YELLOW,
        "grey" => Color::GREY,
        "gray" => Color::GRAY,
        _ => {
            println!("unknown color {}",name);
            Color::MAGENTA
        },
    }
}


