use std::collections::HashMap;
use serde::{Deserialize, Serialize};

pub const ListAppsRequest_name: &str = "MAKE_ListAppsRequest_name";
#[derive(Serialize, Deserialize, Debug)]
pub struct ListAppsRequest {
    #[serde(rename = "type")]
    pub type_:String,
}
pub const ListAppsResponse_name: &str = "MAKE_ListAppsResponse_name";
#[derive(Serialize, Deserialize, Debug)]
pub struct ListAppsResponse {
    #[serde(rename = "type")]
    pub type_:String,
    pub connection_count:i64,
    pub apps:apps_list,
}
pub type apps_list = Vec<app_info>;
pub const app_info_name: &str = "MAKE_app_info_name";
#[derive(Serialize, Deserialize, Debug)]
pub struct app_info {
    #[serde(rename = "type")]
    pub type_:String,
    pub id:String,
    pub name:String,
    pub path:String,
    pub args:String,
}
pub const TestStart_name: &str = "MAKE_TestStart_name";
#[derive(Serialize, Deserialize, Debug)]
pub struct TestStart {
    #[serde(rename = "type")]
    pub type_:String,
    pub sender:String,
}
pub const StartApp_name: &str = "MAKE_StartApp_name";
#[derive(Serialize, Deserialize, Debug)]
pub struct StartApp {
    #[serde(rename = "type")]
    pub type_:String,
    pub target:String,
}
pub const StopApp_name: &str = "MAKE_StopApp_name";
#[derive(Serialize, Deserialize, Debug)]
pub struct StopApp {
    #[serde(rename = "type")]
    pub type_:String,
    pub target:String,
}
pub const RestartApp_name: &str = "MAKE_RestartApp_name";
#[derive(Serialize, Deserialize, Debug)]
pub struct RestartApp {
    #[serde(rename = "type")]
    pub type_:String,
    pub target:String,
}