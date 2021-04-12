use crate::backend::Backend;
use std::collections::HashMap;
use raylib::color::Color;
use raylib::{RaylibHandle, RaylibThread};

pub struct RaylibBackend {
    rl:RaylibHandle,
    thread:RaylibThread,
}
impl RaylibBackend {
    pub fn make(width:i32,height:i32,fps:i32) -> Backend {
        let mut colors:HashMap<String,Color> = HashMap::new();
        colors.insert("black".parse().unwrap(), Color::BLACK);
        colors.insert("white".parse().unwrap(), Color::WHITE);
        colors.insert("red".parse().unwrap(), Color::RED);
        colors.insert("green".parse().unwrap(), Color::GREEN);
        colors.insert("skyblue".parse().unwrap(), Color::SKYBLUE);
        colors.insert("blue".parse().unwrap(), Color::BLUE);

        // open window
        let (mut rl, thread) = raylib::init()
            .size(640, 480)
            .title(name)
            .build();
        rl.set_target_fps(60);

        return RaylibBackend {
            rl:rl,
            thread:thread,
        }
    }
    pub fn start_loop(&self) {

    }
}