use std::collections::HashMap;
use std::f32::consts::PI;
use std::net::TcpStream;
use std::sync::mpsc::{channel};
use std::thread;

use serde::{Deserialize, Serialize};
use websocket::{Message, OwnedMessage};
use websocket::ClientBuilder;
use websocket::receiver::Reader;
use websocket::sender::Writer;

use messages::{CloseWindowScreen, DrawImageMessage, DrawPixelMessage, FillRectMessage, MouseDownMessage, MouseUpMessage, OpenWindowScreen, RefreshWindowMessage, RenderMessage, WindowListMessage};
use window::{Point, Window};

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

    let (mut server_reader, mut server_sender) = client.split().unwrap();
    //create a channel
    let (tx, websocket_sending_rx) = channel();
    let websocket_sending_tx = tx.clone();
    let (render_loop_send, render_loop_receive) = channel::<RenderMessage>();

    //loop for receiving
    let receive_loop = thread::spawn(move || {
        process_incoming(&mut server_reader, &websocket_sending_tx, &render_loop_send);
    });

    //loop for sending
    let send_loop = thread::spawn(move || {
        process_outgoing(&websocket_sending_rx, &mut server_sender);
    });


    //send the initial connection message
    let message = OwnedMessage::Text("{\"type\":\"SCREEN_START\"}".to_string());
    match tx.send(message) {
        Ok(()) => (),
        Err(e) => {
            println!("error sending: {:?}", e);
        }
    }

    let mut backend= RaylibBackend::make(640,480,60);
    backend.start_loop(&mut windows, &render_loop_receive, &tx);

        //wait for the end
    println!("Waiting for child threads to exit");

    let _ = send_loop.join();
    let _ = receive_loop.join();

    println!("Exited");

}

