use std::{io, error};
use std::fs::File;
use std::io::BufReader;

use image::io::Reader as ImageReader;
use image::{DynamicImage, ImageError, GenericImageView};
use std::error::Error;
use std::io::Error as IOError;
use serde::ser::StdError;
use raylib::text::Font;

pub struct FontInfo {
    pub bitmap: DynamicImage,
    pub metrics: serde_json::Value
}

impl FontInfo {
    pub fn load_font(png_path:&str,json_path:&str) -> Result<FontInfo, Box<dyn Error>> {
        println!("loading a font from {} and {}",png_path,json_path);
        let bitmap = FontInfo::load_img(png_path)?;
        let metrics = FontInfo::load_json(json_path)?;
        return Ok(FontInfo {
            bitmap,
            metrics
        })
    }
    pub fn load_json(json_path:&str) -> Result<serde_json::Value, Box<dyn Error>> {
        let file = File::open(json_path)?;
        let reader = BufReader::new(file);
        let metrics:serde_json::Value =  serde_json::from_reader(reader)?;
        println!("metrics are object? {:?}",metrics.is_object());
        return Ok(metrics)
    }
    pub fn load_img(png_path:&str) -> Result<DynamicImage, Box<dyn Error>>{
        let bitmap = ImageReader::open(png_path)?.decode()?;
        println!("image is {}x{}",bitmap.width(), bitmap.height());
        return Ok(bitmap);
    }
}