use std::collections::HashMap;
use serde::{Deserialize, Serialize};

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
#[derive(Serialize, Deserialize, Debug)]
pub struct create_child_window_response {
    #[serde(rename = "type")]
    pub _type:String,
    pub sender:String,
    pub target:String,
    pub parent:String,
    pub window:String,
}
#[derive(Serialize, Deserialize, Debug)]
pub struct create_child_window_display {
    #[serde(rename = "type")]
    pub _type:String,
    pub parent:String,
    pub window:window_info,
    pub sender:String,
}
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
#[derive(Serialize, Deserialize, Debug)]
pub struct close_child_window {
    #[serde(rename = "type")]
    pub _type:String,
    pub parent:String,
    pub sender:String,
    pub id:String,
}
#[derive(Serialize, Deserialize, Debug)]
pub struct close_child_window_response {
    #[serde(rename = "type")]
    pub _type:String,
    pub sender:String,
    pub target:String,
    pub parent:String,
    pub window:String,
}
#[derive(Serialize, Deserialize, Debug)]
pub struct close_child_window_display {
    #[serde(rename = "type")]
    pub _type:String,
    pub parent:String,
    pub window:String,
    pub sender:String,
}