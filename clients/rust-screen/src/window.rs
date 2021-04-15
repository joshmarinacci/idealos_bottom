use serde::{Deserialize, Serialize};

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
}

impl Window {
    pub fn from_info(
                     info:&WindowInfo) -> Window {
        Window {
            id:info.id.clone(),
            x:info.x,
            y:info.y,
            width: info.width,
            height: info.height,
            owner: info.owner.clone(),
            // tex: target,
        }
    }

    pub fn contains(&self, pt:&Point) -> bool {
        if pt.x < self.x { return false; }
        if pt.x > (self.x + self.width) { return false; }
        if pt.y < self.y { return false; }
        if pt.y > (self.y + self.height) { return false; }
        return true
    }
    pub fn border_contains(&self, pt:&Point, border:i32) -> bool {
        if pt.x < self.x-border { return false; }
        if pt.x > (self.x + self.width+border) { return false; }
        if pt.y < self.y-border { return false; }
        if pt.y > (self.y + self.height+border) { return false; }
        return true
    }
}
