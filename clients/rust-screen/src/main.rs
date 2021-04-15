use std::collections::HashMap;
use std::sync::mpsc::{channel};
use std::thread;

use websocket::{OwnedMessage};
use websocket::ClientBuilder;

use messages::{RenderMessage};
use window::{Window};

use crate::incoming::process_incoming;
use crate::outgoing::process_outgoing;
use crate::backend::Backend;
use crate::sdl2backend::SDL2Backend;
use crate::fontinfo::FontInfo;
use sdl2::image::LoadTexture;
use std::fs::File;
use std::io::BufReader;
use std::error::Error;

mod messages;
mod window;
mod incoming;
mod outgoing;
mod backend;
mod sdl2backend;
mod common;
mod fontinfo;


pub fn main() -> Result<(),String> {
    let mut windows:HashMap<String,Window> = HashMap::new();


    let name  = "ws://127.0.0.1:8081";
    let mut client = ClientBuilder::new(name)
        .unwrap()
        .connect_insecure()
        .unwrap();

    println!("we are connected now!");

    //websocket connection
    let (mut server_in, mut server_out) = client.split().unwrap();

    //channel to talk to server sender thread
    let (server_out_receive, server_out_send) = channel();

    //channel to connect server receiver thread and render loop
    let (render_loop_send, render_loop_receive) = channel::<RenderMessage>();

    //loop for receiving
    let server_out_receive_2 = server_out_receive.clone();
    let receive_loop = thread::spawn(move || {
        process_incoming(&mut server_in, &server_out_receive_2, &render_loop_send);
    });

    //loop for sending
    let send_loop = thread::spawn(move || {
        process_outgoing(&server_out_send, &mut server_out);
    });


    //send the initial connection message
    let message = OwnedMessage::Text("{\"type\":\"SCREEN_START\"}".to_string());
    match server_out_receive.send(message) {
        Ok(()) => (),
        Err(e) => {
            println!("error sending: {:?}", e);
        }
    }

    // let mut backend= RaylibBackend::make(640,480,60);


        let sdl_context = sdl2::init()?;
        let video_subsystem = sdl_context.video()?;
        let window = video_subsystem
            .window("rust-sdl2 demo: Video", 1024, 768)
            .position_centered()
            .opengl()
            .build()
            .map_err(|e| e.to_string())?;

        let canvas_builder = window.into_canvas();
        let mut canvas = canvas_builder.build().map_err(|e| e.to_string())?;
        let creator = canvas.texture_creator();

    let png_path =  "../../src/clients/fonts/idealos_font@1.png";
    let fnt_tex = creator.load_texture(png_path)?;
    let info = fnt_tex.query();
    println!("font texture is {}x{}",info.width, info.height);
    let metrics = load_json("../../src/clients/fonts/idealos_font@1.json").unwrap();
    let mut backend = SDL2Backend {
            sdl_context: &sdl_context,
            active_window: None,
            canvas:canvas,
            creator: &creator,
            window_buffers: Default::default(),
            dragging: false,
            dragtarget: None,
            font: FontInfo {
                bitmap: fnt_tex,
                metrics: metrics
            },
        };
        backend.start_loop(
            &mut windows,
            &render_loop_receive,
            &server_out_receive.clone()
        );

        //wait for the end
    println!("Waiting for child threads to exit");

    server_out_receive.send(OwnedMessage::Close(None));
    let _ = send_loop.join();
    let _ = receive_loop.join();

    println!("Exited");
    Ok(())
}



pub fn load_json(json_path:&str) -> Result<serde_json::Value, Box<dyn Error>> {
    let file = File::open(json_path)?;
    let reader = BufReader::new(file);
    let metrics:serde_json::Value =  serde_json::from_reader(reader)?;
    println!("metrics are object? {:?}",metrics.is_object());
    return Ok(metrics)
}
