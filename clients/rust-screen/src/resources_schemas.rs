use std::collections::HashMap;
use serde::{Deserialize, Serialize};

pub const ResourceGet_name: &str = "MAKE_ResourceGet_name";
#[derive(Serialize, Deserialize, Debug)]
pub struct ResourceGet {
    #[serde(rename = "type")]
    pub type_:String,
    pub resource:String,
    pub sender:String,
}
pub const ResourceSet_name: &str = "MAKE_ResourceSet_name";
#[derive(Serialize, Deserialize, Debug)]
pub struct ResourceSet {
    #[serde(rename = "type")]
    pub type_:String,
    pub resource:String,
    pub data:String,
}
pub const ResourceChanged_name: &str = "MAKE_ResourceChanged_name";
#[derive(Serialize, Deserialize, Debug)]
pub struct ResourceChanged {
    #[serde(rename = "type")]
    pub type_:String,
    pub resource:String,
    pub data:String,
    pub mimetype:String,
}
pub const ResourceInvalid_name: &str = "MAKE_ResourceInvalid_name";
#[derive(Serialize, Deserialize, Debug)]
pub struct ResourceInvalid {
    #[serde(rename = "type")]
    pub type_:String,
    pub resource:String,
}