use std::collections::HashMap;
use serde::{Deserialize, Serialize};
use crate::windows_schemas::{create_child_window_display, close_child_window_display, window_open_display};

#[derive(Serialize, Deserialize, Debug)]
pub struct WindowListMessage  {
    #[serde(rename = "type")]
    pub type_:String,
    pub windows:HashMap<String,WindowInfo>,
}

#[derive(Debug)]
pub enum RenderMessage {
    WindowList(WindowListMessage),
    OpenWindow(window_open_display),
    CloseWindow(CloseWindowScreen),
    CreateChildWindow(create_child_window_display),
    CloseChildWindow(close_child_window_display),
    DrawPixel(DrawPixelMessage),
    DrawImage(DrawImageMessage),
    FillRect(FillRectMessage),
}


#[derive(Serialize, Deserialize, Debug)]
pub struct RefreshWindowMessage {
    #[serde(rename = "type")]
    pub type_:String,
    pub target:String,
    pub window:String,
}

#[derive(Serialize, Deserialize, Debug)]
pub struct MouseDownMessage {
    #[serde(rename = "type")]
    pub type_:String,
    pub target:String,
    pub x:i32,
    pub y:i32,
}

#[derive(Serialize, Deserialize, Debug)]
pub struct MouseUpMessage {
    #[serde(rename = "type")]
    pub type_:String,
    pub target:String,
    pub x:i32,
    pub y:i32,
}

#[derive(Serialize, Deserialize, Debug)]
pub struct KeyboardDownMessage {
    #[serde(rename = "type")]
    pub type_:String,
    pub target:String,
    pub keyname:String,
}


#[derive(Serialize, Deserialize, Debug)]
pub struct DrawPixelMessage {
    #[serde(rename = "type")]
    pub type_:String,
    pub color:String,
    pub window:String,
    pub x:i32,
    pub y:i32,
}

#[derive(Serialize, Deserialize, Debug)]
pub struct DrawImageMessage {
    #[serde(rename = "type")]
    pub type_:String,
    pub window:String,
    pub x:i32,
    pub y:i32,
    pub width:i32,
    pub height:i32,
    pub pixels: Vec<u8>,
}

#[derive(Serialize, Deserialize, Debug)]
pub struct FillRectMessage {
    #[serde(rename = "type")]
    pub type_:String,
    pub color:String,
    pub window:String,
    pub x:i32,
    pub y:i32,
    pub width:i32,
    pub height:i32,
}

#[derive(Serialize, Deserialize, Debug)]
pub struct OpenWindowScreen {
    #[serde(rename = "type")]
    pub type_:String,
    pub target:String,
    pub window: WindowInfo,
}

#[derive(Serialize, Deserialize, Debug)]
pub struct CloseWindowScreen {
    #[serde(rename = "type")]
    pub type_:String,
    pub target:String,
    pub window: WindowInfo,
}

#[derive(Serialize, Deserialize, Debug)]
pub struct WindowInfo {
    pub id:String,
    pub x:i32,
    pub y:i32,
    pub width:i32,
    pub height:i32,
    pub owner:String,
    pub window_type:String,
}
