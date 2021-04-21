let canvas = document.querySelector("#canvas")
let scale = 3;
let WIDTH = 256
let HEIGHT = 256
canvas.width = WIDTH*scale;
canvas.height = HEIGHT*scale;

let ctx = canvas.getContext('2d')

const icon_metrics = {
    'cursor':[0,0,8,8],
    'close':[8,0,8,8],
    'resize':[16,0,8,8],
}

let symbols = new Image()

function cut_chroma(img) {
    console.log("cutting chroma")
    let can1 = document.createElement('canvas')
    can1.width = img.width
    can1.height = img.height
    let c1 = can1.getContext('2d')
    c1.drawImage(img,0,0)
    let id = c1.getImageData(0,0,can1.width,can1.height)
    for(let n = 0; n<can1.width*can1.height; n++) {
        let r = id.data[n*4+0]
        let g = id.data[n*4+1]
        let b = id.data[n*4+2]
        //turn pinkish white into transparent
        if(r === 255 && g === 241 && b === 232) {
            id.data[n*4+3] = 0
        }
    }
    c1.putImageData(id,0,0)
    return can1
}

symbols.onload = () => {
    symbols = cut_chroma(symbols)
    ctx.save()
    ctx.scale(scale,scale)
    doit()
    ctx.restore()
}
symbols.src = "symbol_font@1.png"


function doit() {
    function draw_icon(name,x,y) {
        if(!icon_metrics || !icon_metrics[name]) return
        let b = icon_metrics[name]
        ctx.imageSmoothingEnabled = false
        ctx.drawImage(symbols,b[0],b[1],b[2],b[3], x,y,b[2],b[3])
    }

    function box(x, y, w, h,b,f) {
        ctx.fillStyle = b
        ctx.fillRect(x, y, w, h)
        ctx.fillStyle = f
        ctx.fillRect(x + 1, y + 1, w - 2, h - 2)
    }

    function text(x,y,str,color) {
        ctx.fillStyle = color?color:'black'
        ctx.font = '8px pixel'
        ctx.fillText(str, x,y+6)
    }

    function menubar() {
        box(0, 0, WIDTH, 9, 'black', 'white')
        text(2, 1, "File")
        {
            let x = 20
            box(x, 0, 27, 9, 'black', 'black')
            text(x+2, 1, "Edit", 'white')

            box(x, 8, 50, 27, 'black', 'white')
            text(x+2, 10 - 1, "Cut")
            text(x+2, 20 - 2, "Copy")
            text(x+2, 30 - 3, "Paste")
        }
        {
            let x = 47
            // box(x, 0, 27, 9, 'black', 'white')
            text(x+2, 1, "View", 'black')
        }
    }



    function make_window(x,y,w,h, title) {
        //bounds
        box(x,y,w,h,'black','white')
        //title
        box(x,y,w,9,'black','black')
        text(x+2,y+2,title,'white')
        // box(x+w-9,y,9,9,'black','white')
        //close button
        box(x+w-8,y+1,7,7,'white','white') // top arrow
        draw_icon('close',x+w-8,y+1)
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
        // box(x+w-7,y+h-7,5,5,'black','white')
        draw_icon('resize',x+w-8,y+h-8)
    }
    function icon8(x, y, invert) {
        box(x,y,5,5,invert?'white':'black',invert?'black':'white');
    }
    function icon16(x, y, invert) {
        box(x,y,13,13,invert?'white':'black',invert?'black':'white');
    }
    function make_texteditor() {
        // make text editor
        ctx.save()
        ctx.translate(10,40)
        make_window(10,30,100,80,'Edit: file.txt')
        //editable text
        text(14,42,'Hi There!')
        //cursor
        box(14+55,40,1,9,'black')
        box(14+55-1,40,3,1,'black')
        box(14+55-1,40+8,3,1,'black')
        //text overlay
        box(30,85,38,7,'black','black')
        text(31,85,"52 wds",'white')
        ctx.restore()
    }

    menubar()
    make_texteditor()

    //menubar icons
    icon8(WIDTH-10,2,false) //wifi
    icon8(WIDTH-20,2,false) //sound
    icon8(WIDTH-30,2,false) //battery

    draw_icon('cursor',10,10)

    function sidebar(x,y,w,h) {
        ctx.save()
        ctx.translate(x,y)
        box(0,0,w,h,'black','white')

        //date/time
        icon8(2,2,false)
        text(2,12,'2:18 PM Wed 4/21')
        //music player
        box(0,30,w,30,'black','black') //bg
        box(1,31,4,29,'white','white') //time indicator
        box(2,32,2,10,'black','black') //time indicator
        text(8,32,'Hey Jude','white')
        text(8,42,'.ters - The Beatl.','white')
        text(26,52,'<< || >>','white')

        //little cpu monitor
        box(0,60,w,16+2,'black','white')
        let data = [1,3,8,5,4,5,1,8,1,7,5,1,2,1,8,5,3,6,1,4,4,3,2,8,2]
        data.forEach((v,i) => {
            ctx.fillStyle = 'black'
            let h = 10
            let x = i*2+2
            for(let j=v; j>0; j--) {
                ctx.fillRect(x,77+j*2-v*2,1,1)
            }
        })

        //weather
        box(0,75,w,17,'black','white')
        icon16(2,77,false)
        text(17,80,'45d')

        //notitfications area
        box(0,94,w,h-94,'black','white')
        let notifs = [
            ["Hey man,","what's up!"],
            ["1:30PM: ","planning meeting"],
            ["Bobby Tables ","Movie Night!"],
        ]
        notifs.forEach((v,i)=>{
            let hh = 20
            box(0,94+i*hh,w,hh+1,'black','white')
            icon8(2,94+i*hh+3,false)
            v.forEach((s,k)=>{
                text(8,94+i*hh+2+k*8,s,'black');
            })
        })
        ctx.restore()
    }
    sidebar(WIDTH-80,8,80,HEIGHT-8)

    function make_calculator(wx,wy) {
        make_window(wx,wy,80,120,'Jesse Calc')
        ctx.save()
        ctx.translate(wx,wy)
        let x = 5
        let y = 10;
        text(x,y,"45m * 8ft ="); y+=10
        text(x,y,"    1152 ft^2"); y+=10
        y+=10
        text(x,y,"45m * 8ft ="); y+=10
        text(x,y,"    1152 ft^2"); y+=10
        y+=10
        ctx.restore()
    }

    //jesse calc. has no horizontal scrollbar
    make_calculator(80,120)


}

