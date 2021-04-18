window.into_canvas gives you a Canvas

image::LoadSurface will load a file from a string path into a surface. or from an in memory array.
TextureCreator::loadTexture will load an image from a string path directly into a texture. or from an in memory array.


Window, Canvas, Surface, TextureCreator, Texture

A `Texture` is an image which exists in GPU memory. You cannot access it directly. They can
only be created from a TextureCreator. This creator will own them and must have the same lifetime.

A `Canvas` an abstraction over a window or a surface. Drawing to a canvas does not actually update the screen. You have to call canvas.present first.  You don't have access to the window for the canvas after you turn the iwndow into a canvas, but you can still reference it using canvas.window() and canvas.window_mut()


A `Window` is a real OS level window.  You can draw into it by converting it to a `Canvas`

A `Surface` is anything you can draw onto.  The window can be drawn into, but you can also draw into other
in memory surfaces, such as a texture target.

If you want to modify an existing texture, you can temporarily make the canvas target a texture, edit it, then go back, using
`canvas.with_texture_canvas()`.

Let's have some examples.

## Simple Window

Create a basic window, clear it with black, then draw a yellowish colored rectangle.

```rust
let window = video_subsystem.window("Example", 800, 600).build().unwrap();

let mut canvas : Canvas<Window> = window.into_canvas()
    .build().unwrap();
canvas.set_draw_color(Color::RGB(0, 0, 0));
canvas.clear();

canvas.set_draw_color(Color::RGB(255, 210, 0));
canvas.fill_rect(Rect::new(10, 10, 780, 580));
canvas.present();
```

## Load and Draw Image

## Load Image with std rust apis

This will load an image using the standard Rust Image APIs, then convert it
into a texture. First it loads the image. Then it creates a texture of the
same size. Then it calls texture.with_lock to get direct access to the bytes,
so you can copy in the pixels or generate new ones (such as with gradients).

BTW: *Note* that the order is probably little endian, so the pixels will be in the order
ABGR instead of RGBA. 

```rust
use image::io::Reader as ImageReader;

    let rust_image = ImageReader::open(png_path) //open file
        .map_err(|e|e.to_string())? // handle error
        .decode().map_err(|e|e.to_string()+"bar")? // uncompress into memory
        .into_rgba8(); // convert to RGBA bytes
    // make a texture with the same size
    let texure = creator.create_texture_streaming(PixelFormatEnum::RGBA8888,
        rust_img.width(),
        rust_img.height());

fnt_tex2.with_lock(None, |buffer: &mut [u8], pitch: usize| {
    for y in 0..rust_img.width() {
        for x in 0..rust_img.height() {
            let ux = x as usize;
            let uy = y as usize;
            let offset = uy * pitch + ux * 4;
            let pixel = rust_img.get_pixel(x,y);
            buffer[offset] = 255;
            buffer[offset + 1] = pixel[2];
            buffer[offset + 2] = pixel[1];
            buffer[offset + 3] = pixel[0];
    }
}
})?;
```

## Load and Scale Image before drawing


load image to a surface
create a new bigger surface
copy first surface into second, with scaling
turn into a cursor

```rust
//load original image into small surface
let small_surf = Surface::from_file("../../resources/cursor.png")?;
let small_size = Rect::new(0, 0, small_surf.width(), small_surf.height());

// create bigger surface
let mut big_surf = Surface::new(small_size.width()*4, small_size.height()*4, small_surf.pixel_format_enum())?;
let big_size = Rect::new(0, 0, big_surf.width(), big_surf.height());
//copy small to big
small_surf.blit_scaled(small_size, &mut big_surf, big_size);
//turn into a cursor
let cursor = Cursor::from_surface(big_surf, 0, 0)?;
cursor.set();
```

