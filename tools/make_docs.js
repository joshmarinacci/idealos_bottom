import path from 'path'
import fs from 'fs'

const ul = function (...content) {
	return `<ul>\n${content.join("\n")}\n</ul>`
}
const li = (txt) => {
	return `<li>${txt}</li>`
}

// const a = (opts,content) => {
// 	let atts = Object.entries(opts).map(([key,value]) => {
// 		return `${key}="${value}"`
// 	}).join(" ")
// 	return `<a ${atts}>${content}</a>`
// }

function make_element(fn) {
	return function() {
		let children = []
		return fn({children})
	}
}
function make_simple_element(name) {
	return function(...children) {
		return `<${name}>\n${children.join("\n")}\n</${name}>`
	}
}
function make_options_element(name, settings) {
	settings = settings || {}
	let close = settings.hasOwnProperty('close')?settings.close:true;
	let break_line = settings.hasOwnProperty('break_line')?settings.break_line:true;
	// console.log(`${name} is close=${close} break_line =${break_line}`)
	return function(opts,...children) {
		// console.log("options = ", opts, typeof opts)
		if(typeof opts !== 'object') {
			children.unshift(opts)
			opts = {}
		}
		let atts = Object.entries(opts).map(([key,value]) => {
			return ` ${key}="${value}"`
		}).join("")

		let begin = `<${name}${atts}>`
		let end = `</${name}>`
		if(!close) end = ''
		return begin
			+ ((break_line&&close)?"\n":"")
			+ (children.join("\n"))
			+ end
	}
}

const PAGES = [
	{name:"Mission Replay", slug:'mission_replay'},
	{name:"Sim Replay", slug:'sim_replay'},
	{name:'CarViz Pro', slug:'carviz_ide'},
	{name:'Copilot CV', slug:'copilot'},
	{name:'Passenger CV', slug:'passenger'},
	{name:'Web SDK', slug:'websdk'},
	{name:'Native SDK', slug:'cppsdk'},
	{name:'Cloud CV', slug:'carviz_cloud'},
	{name:'CarViz VR', slug:'webxr'},
]

const main_nav = make_element(() => {
	let links = PAGES.map(({name,slug}) => {
		return li(a({href:'/'+slug+".html"},name))
	}).join("\n")
	return ul(links)
})



const html = make_options_element('html')
const meta = make_options_element('meta',{close:false})
const link = make_options_element('link',{close:false})
const h1 = make_simple_element('h1');
const h2 = make_simple_element('h2');
const h3 = make_simple_element('h3');
const header = make_simple_element('header');
const div = make_options_element('div')
const body = make_options_element('body')
const p = make_options_element('p')
const section = make_options_element('section')
const img = make_options_element('img',{close:false})
const a = make_options_element('a',{break_line:false})
const b = make_options_element('b',{break_line:false})
const i = make_options_element('i',{break_line:false})



const BUILD_DIR = "build2"

async function page(opts,content) {
	let pth = path.join(BUILD_DIR,opts.file)
	console.log("rendering to",pth)
	console.log('content is',content)
	fs.promises.writeFile(pth,content);
}

async function copy(opts) {
	let pth = path.join(BUILD_DIR,opts.dst)
	console.log(`copying from ${opts.src} to ${pth}`)
	let data = await fs.promises.readFile(opts.src)
	await fs.promises.writeFile(pth,data)
}

async function runit() {
	await page({file:'index.html'},
		html({lang:'en'},
			meta({charset:'utf-8'}),
			link({href:'foo.css', rel:'stylesheet'}),
			body(
				main_nav(),
				div({class:"main"},
					header(
						h1(
							b("AV"),i("STDIO"),
						),
						p("for all your AV training and visualization needs."),
					),
					section(
						h2("Applications"),
						div({class:'tool-panel'},
							a({href:"mission_replay"},	img({src:"mission_replay_square.png"})),
							h3("Mission Replay"),
							p("review and triange any mission",b("instantly!"),),
						),
					)
				)
			),
		),
	)

	await copy({src:'tools/main.css',dst:'main.css'})
	await copy({src:'tools/images/img1.png', dst:'images/img1.png'})
}



runit().then(()=>console.log("done!"))
