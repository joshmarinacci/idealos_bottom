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