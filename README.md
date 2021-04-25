This repo contains the bottom half of IdealOS, a theoretical desktop operating system that builds
on the lessons of the past and tries to implement a full system in 1% of the code. This repo
contains the graphics and input layers up through debugging tools and some simple proof of concept apps.
Currently it runs on Mac, but should work on anything supported by SDL2 that can run NodeJS and the Rust compiler.  Right now it runs in a window on top of your existing OS.


## Steps to Run

* make sure you have SDL2 installed on your machine already.
* make sure you have cargo and rust installed already. 
* check out the code with git
* install deps with `npm install`
* run the main server and default apps with `npm run start-server`
* run the rust display server `npm run rust`
