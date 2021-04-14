function rect(x, y, w, h,color) {
    return {
        type:'draw_rect',
        x,y,w,h,color
    }
}
function text(text, x, y, color) {
    return {
        type:'draw_text',
        text,
        x,
        y,
        w:text.length*10,
        h:20,
        color,
    }
}

const min = (a,b) => Math.min(a,b)
const sum = (a,b) => a+b

function padding(v) {
    return { left: v, right: v, top: v, bottom: v}
}

function row(opts) {
    let gap = 5
    let p = padding(5)
    let h = p.top + opts.children.map(ch => ch.h).reduce(min) + p.bottom
    let w = p.left + opts.children.map(ch => ch.w).reduce((a,b) => a + gap + b) + p.right;
    let x = p.left
    opts.children.forEach(ch => {
        ch.x = x
        x+= ch.w;
        x+= gap
        ch.y = (h - ch.h)/2;
    })
    let type = 'box'
    x = 0
    let y = 0
    let children = [
        rect(x,y,w,h, 'row.background.color'),
        ...opts.children
    ]
    return {type,x,y,w,h,children}
}


function label(opts) {
    return text(opts.text,0,0,'label.text.color')
}

function button(opts) {
    let txt = label({text:opts.text});
    let p = padding(5)
    let w = p.left + txt.w + p.right
    let h = p.top + txt.h + p.bottom
    return {
        type:'box',
        x: 0,
        y: 0,
        w: w,
        h: h,
        children: [
            rect(0, 0, w, h, 'button.background.color'),
            text(opts.text, p.left, p.top, 'button.text.color')
        ]
    }
}

let r =
    // label({text:'hello'})
    // button({text:'login'})
    row({
            children: [
                label({text: 'hello'}),
                button({text: 'login', action: 'do_stuff'})
            ]
        }
    )
console.log(JSON.stringify(r,null,'   '))

function to_display_list(root,x=0,y=0) {
    console.log("root is",root.type,x,y)
    if(root.type === 'box') {
        return root.children.map(ch => to_display_list(ch,x+root.x,y+root.y)).flat()
    }
    if(root.type === 'draw_text') {
        return {... root, x:root.x+x, y:root.y+y}
    }
    if(root.type === 'draw_rect') {
        return {... root, x:root.x+x, y:root.y+y}
    }
    return []
}

console.log(to_display_list(r));

