use std::collections::HashMap;
use serde::{Deserialize, Serialize};

pub const MouseDown_name: &str = "MAKE_MouseDown_name";
#[derive(Serialize, Deserialize, Debug)]
pub struct MouseDown {
    #[serde(rename = "type")]
    pub type_:String,
    pub x:i64,
    pub y:i64,
    pub target:String,
}
pub const MouseUp_name: &str = "MAKE_MouseUp_name";
#[derive(Serialize, Deserialize, Debug)]
pub struct MouseUp {
    #[serde(rename = "type")]
    pub type_:String,
    pub x:i64,
    pub y:i64,
    pub target:String,
}
pub const KeyboardDown_name: &str = "MAKE_KeyboardDown_name";
#[derive(Serialize, Deserialize, Debug)]
pub struct KeyboardDown {
    #[serde(rename = "type")]
    pub type_:String,
    pub keyname:String,
    pub target:String,
}
pub const KeyboardUp_name: &str = "MAKE_KeyboardUp_name";
#[derive(Serialize, Deserialize, Debug)]
pub struct KeyboardUp {
    #[serde(rename = "type")]
    pub type_:String,
    pub keyname:String,
    pub target:String,
}