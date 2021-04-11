use serde::{Deserialize, Serialize};
use serde_json::{json, Result, Value};

use raylib::{RaylibHandle, RaylibThread};
use raylib::color::Color;
use raylib::core::drawing::{RaylibDraw, RaylibTextureModeExt};
use raylib::core::texture::RenderTexture2D;

use crate::messages::WindowInfo;

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct Rect {
    pub x:i32,
    pub y:i32,
    pub width:i32,
    pub height:i32,
    pub color:String,
}


#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct Point {
    pub x:i32,
    pub y:i32,
}

pub struct Window {
    pub id:String,
    pub x:i32,
    pub y:i32,
    pub width:i32,
    pub height:i32,
    pub owner:String,
    pub tex:RenderTexture2D
}

impl Window {
    pub fn from_info(mut rl:&mut RaylibHandle, thread:&RaylibThread, info:&WindowInfo) -> Window {
        let mut target = rl.load_render_texture(thread, info.width as u32, info.height as u32).unwrap();
        {
            let mut d = rl.begin_texture_mode(thread,  &mut target);
            d.clear_background(Color::MAROON);
            d.draw_circle(info.width/2,info.height/2,4.0,Color::GREEN);
        }
        Window {
            id:info.id.clone(),
            x:info.x,
            y:info.y,
            width: info.width,
            height: info.height,
            owner: info.owner.clone(),
            tex: target,
        }
    }

    pub fn contains(&self, pt:&Point) -> bool {
        if pt.x < self.x { return false; }
        if pt.x > (self.x + self.width) { return false; }
        if pt.y < self.y { return false; }
        if pt.y > (self.y + self.height) { return false; }
        return true
    }
}
