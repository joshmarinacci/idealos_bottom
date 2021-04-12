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
use crate::raylib_backend::RaylibBackend;

mod messages;
mod window;
mod incoming;
mod outgoing;
mod raylib_backend;
mod backend;


fn main() {
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

    let mut backend= RaylibBackend::make(640,480,60);
    backend.start_loop(&mut windows, &render_loop_receive, &server_out_receive.clone());

        //wait for the end
    println!("Waiting for child threads to exit");

    let _ = send_loop.join();
    let _ = receive_loop.join();

    println!("Exited");

}

