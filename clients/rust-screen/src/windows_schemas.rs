use std::collections::HashMap;
use serde::{Deserialize, Serialize};

pub const window_info_name: &str = "MAKE_window_info_name";
#[derive(Serialize, Deserialize, Debug)]
pub struct window_info {
    pub id:String,
    pub width:i64,
    pub height:i64,
    pub x:i64,
    pub y:i64,
    pub owner:String,
    pub window_type:String,
}
pub type window_array = Vec<window_info>;
pub type window_map = HashMap<String,window_info>;
pub const window_open_name: &str = "MAKE_window_open_name";
#[derive(Serialize, Deserialize, Debug)]
pub struct window_open {
    pub width:i64,
    pub height:i64,
    pub sender:String,
    pub window_type:String,
}
pub const window_open_display_name: &str = "MAKE_window_open_display_name";
#[derive(Serialize, Deserialize, Debug)]
pub struct window_open_display {
    pub target:String,
    pub window:window_info,
}
pub const window_open_response_name: &str = "MAKE_window_open_response_name";
#[derive(Serialize, Deserialize, Debug)]
pub struct window_open_response {
    pub target:String,
    pub window:String,
}
pub const window_close_name: &str = "MAKE_window_close_name";
#[derive(Serialize, Deserialize, Debug)]
pub struct window_close {
    pub target:String,
    pub window:String,
}
pub const window_list_name: &str = "MAKE_window_list_name";
#[derive(Serialize, Deserialize, Debug)]
pub struct window_list {
    pub windows:window_map,
}
pub const window_refresh_request_name: &str = "MAKE_window_refresh_request_name";
#[derive(Serialize, Deserialize, Debug)]
pub struct window_refresh_request {
    #[serde(rename = "type")]
    pub _type:String,
    pub target:String,
    pub window:String,
}
pub const window_refresh_response_name: &str = "MAKE_window_refresh_response_name";
#[derive(Serialize, Deserialize, Debug)]
pub struct window_refresh_response {
}
pub const create_child_window_name: &str = "MAKE_create_child_window_name";
#[derive(Serialize, Deserialize, Debug)]
pub struct create_child_window {
    #[serde(rename = "type")]
    pub _type:String,
    pub parent:String,
    pub x:i64,
    pub y:i64,
    pub width:i64,
    pub height:i64,
    pub style:String,
    pub sender:String,
}
pub const create_child_window_response_name: &str = "MAKE_create_child_window_response_name";
#[derive(Serialize, Deserialize, Debug)]
pub struct create_child_window_response {
    #[serde(rename = "type")]
    pub _type:String,
    pub sender:String,
    pub target:String,
    pub parent:String,
    pub window:String,
}
pub const create_child_window_display_name: &str = "MAKE_create_child_window_display_name";
#[derive(Serialize, Deserialize, Debug)]
pub struct create_child_window_display {
    #[serde(rename = "type")]
    pub _type:String,
    pub parent:String,
    pub window:window_info,
    pub sender:String,
}
pub const close_child_window_name: &str = "MAKE_close_child_window_name";
#[derive(Serialize, Deserialize, Debug)]
pub struct close_child_window {
    #[serde(rename = "type")]
    pub _type:String,
    pub parent:String,
    pub sender:String,
    pub id:String,
}
pub const close_child_window_response_name: &str = "MAKE_close_child_window_response_name";
#[derive(Serialize, Deserialize, Debug)]
pub struct close_child_window_response {
    #[serde(rename = "type")]
    pub _type:String,
    pub sender:String,
    pub target:String,
    pub parent:String,
    pub window:String,
}
pub const close_child_window_display_name: &str = "MAKE_close_child_window_display_name";
#[derive(Serialize, Deserialize, Debug)]
pub struct close_child_window_display {
    #[serde(rename = "type")]
    pub _type:String,
    pub parent:String,
    pub window:String,
    pub sender:String,
}