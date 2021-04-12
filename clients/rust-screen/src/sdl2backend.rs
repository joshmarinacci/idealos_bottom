use std::time::Duration;
use std::sync::mpsc::{Sender, Receiver};
use std::collections::HashMap;
use websocket::OwnedMessage;

use crate::window::Window;
use crate::messages::RenderMessage;
use crate::backend::Backend;


use sdl2::event::Event;
use sdl2::keyboard::Keycode;
use sdl2::pixels::Color;
use sdl2::render::{Canvas, WindowCanvas};
use sdl2::Sdl;

pub struct SDL2Backend {
    active_window:Option<String>,
    pub canvas: WindowCanvas,
    pub sdl_context: Sdl
}

impl SDL2Backend {
    pub fn make(width: i32, height: i32, fps: u32) -> Result<SDL2Backend,String> {
        let sdl_context = sdl2::init()?;
        let video_subsystem = sdl_context.video()?;
        let window = video_subsystem
            .window("rust-sdl2 demo: Video", 800, 600)
            .position_centered()
            .opengl()
            .build()
            .map_err(|e| e.to_string())?;

        let mut canvas = window.into_canvas().build().map_err(|e| e.to_string())?;
        canvas.set_draw_color(Color::RGB(255, 0, 0));
        canvas.clear();
        canvas.present();

        return Ok(SDL2Backend {
            sdl_context:sdl_context,
            canvas:canvas,
            active_window: Option::None,
        })
    }
}

impl Backend for SDL2Backend {
    fn start_loop(&mut self, windows: &mut HashMap<String, Window>, incoming: &Receiver<RenderMessage>, outgoing: &Sender<OwnedMessage>) -> Result<(),String> {
        let mut event_pump = self.sdl_context.event_pump()?;

        'running: loop {
            for event in event_pump.poll_iter() {
                match event {
                    Event::Quit { .. }
                    | Event::KeyDown {
                        keycode: Some(Keycode::Escape),
                        ..
                    } => break 'running,
                    _ => {}
                }
            }

            self.canvas.clear();
            self.canvas.present();
            ::std::thread::sleep(Duration::new(0, 1_000_000_000u32 / 30));
            // The rest of the game loop goes here...
        }
        println!("SDL thread is ending");
        Ok(())
    }
}
