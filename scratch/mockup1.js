let canvas = document.querySelector("#canvas")
let scale = 4;
let WIDTH = 128
canvas.width = WIDTH*scale;
canvas.height = 128*scale;

let ctx = canvas.getContext('2d')
ctx.save()
ctx.scale(scale,scale)
// ctx.fillStyle = 'black'
// ctx.fillRect(0,0,64,64)

function doit() {
//draw menu bar
    function box(x, y, w, h,b,f) {
        ctx.fillStyle = b
        ctx.fillRect(x, y, w, h)
        ctx.fillStyle = f
        ctx.fillRect(x + 1, y + 1, w - 2, h - 2)
    }

    function text(x,y,str,color) {
        ctx.fillStyle = color?color:'black'
        ctx.font = '6px pixel'
        ctx.fillText(str, x,y+6)
    }

    function menubar() {
        box(0, 0, WIDTH, 9, 'black', 'white')
        text(2, 2, "File")
        box(30,0,27,9,'black','black')
        text(32,2,"Edit",'white')

        box(30,8,50,29,'black','white')
        text(32,11,"Cut")
        text(32,20,"Copy")
        text(32,29,"Paste")
    }

    menubar()


    function make_window(x,y,w,h) {
        //bounds
        box(x,y,w,h,'black','white')
        //title
        box(x,y,w,9,'black','black')
        text(x+2,y+2,'Edit: file.txt','white')
        box(x+w-9,y,9,9,'black','white')
        //close button
        box(x+w-7,y+2,5,5,'black','black') // top arrow
        //horizontal scrollbar
        box(x,y+h-9,w-8,9,'black','white') //border
        box(x+2,y+h-9+2,3,5,'black','black') //left arrow
        box(x+6,y+h-9+2,w-20,5,'black','white') //track
        box(x+12,y+h-9+2,w-60,5,'black','black') //thumb
        box(x+w-13,y+h-9+2,3,5,'black','black') //right arrow
        //vertical scrollbar
        box(x+w-9,y+8,9,h-16,'black','white')
        box(x+w-7,y+14,5,h-28,'black','white')//track
        box(x+w-7,y+10,5,3,'black','black') // top arrow
        box(x+w-7,y+h-13,5,3,'black','black') // bottom arrow
        box(x+w-7,y+30,5,30,'black','black') // thumb
        //resize handle
        box(x+w-7,y+h-7,5,5,'black','white')
    }

    // make text editor
    make_window(10,30,100,80)
    //editable text
    text(14,42,'Hi There!')
    //cursor
    box(14+55,40,1,9,'black')
    box(14+55-1,40,3,1,'black')
    box(14+55-1,40+8,3,1,'black')
    //text overlay

    box(30,85,38,7,'black','black')
    text(31,86,"52 wds",'white')

}
doit()

ctx.restore()
