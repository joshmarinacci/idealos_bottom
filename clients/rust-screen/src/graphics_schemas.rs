use std::collections::HashMap;
use serde::{Deserialize, Serialize};

pub const DrawPixel_name: &str = "MAKE_DrawPixel_name";
#[derive(Serialize, Deserialize, Debug)]
pub struct DrawPixel {
    #[serde(rename = "type")]
    pub type_:String,
    pub window:String,
    pub color:String,
    pub x:i64,
    pub y:i64,
}
pub const DrawRect_name: &str = "MAKE_DrawRect_name";
#[derive(Serialize, Deserialize, Debug)]
pub struct DrawRect {
    #[serde(rename = "type")]
    pub type_:String,
    pub window:String,
    pub color:String,
    pub x:i64,
    pub y:i64,
    pub width:i64,
    pub height:i64,
}