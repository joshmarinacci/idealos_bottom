use serde::{Deserialize, Serialize};

use crate::messages::WindowInfo;
use idealos_schemas::windows::window_info;

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
    pub window_type:String,
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
            window_type: info.window_type.clone(),
        }
    }
    pub fn from_info2(info:&window_info) -> Window {
        Window {
            id: info.id.clone(),
            x: info.x as i32,
            y: info.y as i32,
            width: info.width as i32,
            height: info.height as i32,
            owner: info.owner.clone(),
            window_type: info.window_type.clone(),
        }
    }

    pub fn contains(&self, pt:&Point) -> bool {
        if pt.x < self.x { return false; }
        if pt.x > (self.x + self.width) { return false; }
        if pt.y < self.y { return false; }
        if pt.y > (self.y + self.height) { return false; }
        return true
    }
    pub fn border_contains(&self, pt:&Point, border:&Insets) -> bool {
        if pt.x < self.x-border.left { return false; }
        if pt.x > (self.x + self.width+border.right) { return false; }
        if pt.y < self.y-border.top { return false; }
        if pt.y > (self.y + self.height+border.bottom) { return false; }
        return true
    }
}

pub struct Insets {
    pub left:i32,
    pub right:i32,
    pub top:i32,
    pub bottom:i32,
}