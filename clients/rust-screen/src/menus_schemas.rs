use std::collections::HashMap;
use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize, Debug)]
pub enum node_type { }
#[derive(Serialize, Deserialize, Debug)]
pub struct keystroke_obj {
    pub modifier:String,
    pub key:String,
}
#[derive(Serialize, Deserialize, Debug)]
pub struct item {
    #[serde(rename = "type")]
    pub _type:node_type,
    pub label:String,
    pub event:String,
    pub keystroke:keystroke_obj,
}
#[derive(Serialize, Deserialize, Debug)]
pub struct item_array { }
#[derive(Serialize, Deserialize, Debug)]
pub struct root {
    #[serde(rename = "type")]
    pub _type:node_type,
    pub children:item_array,
}
#[derive(Serialize, Deserialize, Debug)]
pub struct create_menu_tree_message {
    #[serde(rename = "type")]
    pub _type:String,
    pub menu:root,
}