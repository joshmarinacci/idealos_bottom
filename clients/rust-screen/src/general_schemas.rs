use std::collections::HashMap;
use serde::{Deserialize, Serialize};

pub const Heartbeat_name: &str = "MAKE_Heartbeat_name";
#[derive(Serialize, Deserialize, Debug)]
pub struct Heartbeat {
    #[serde(rename = "type")]
    pub type_:String,
}
pub const ScreenStart_name: &str = "MAKE_ScreenStart_name";
#[derive(Serialize, Deserialize, Debug)]
pub struct ScreenStart {
    #[serde(rename = "type")]
    pub type_:String,
}
pub const Connected_name: &str = "MAKE_Connected_name";
#[derive(Serialize, Deserialize, Debug)]
pub struct Connected {
    #[serde(rename = "type")]
    pub type_:String,
}
pub type log_data = Vec<String>;
pub const Log_name: &str = "MAKE_Log_name";
#[derive(Serialize, Deserialize, Debug)]
pub struct Log {
    #[serde(rename = "type")]
    pub type_:String,
    pub data:log_data,
}