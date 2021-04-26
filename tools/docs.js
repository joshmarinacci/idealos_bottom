import {copy, page} from "static-build-tools"
import path from "path"
import {flatten_html, parse_markdown} from './markdown.js'
import {body, file_as_string, html, link, log, script} from './util.js'
import fs from 'fs'

const DOCS_DIR = "./docs"
const OUT_DIR = "./build"

async function stylesheet(src) {
    let dst = path.basename(src)
    let outdir = path.join(OUT_DIR,"css")
    await fs.promises.mkdir(outdir,{recursive:true})
    await copy({builddir: outdir, src, dst})
    return link({rel:'stylesheet',href:path.join("css",dst)})
}

function include_mermaid() {
    return script({src:"https://cdn.jsdelivr.net/npm/mermaid/dist/mermaid.min.js"})
}

function execute_mermaid() {
    return script(`mermaid.initialize({startOnLoad:true})`)
}

async function doit() {
    // await copy({builddir: BUILD_DIR, src: 'src/App.css', dst: 'App.css'})
    // await async_map(PAGES,async (pg) => {
//    await copyall({
//         builddir: BUILD_DIR,
//         src: 'src/images/',
//         include: (f) => (f.endsWith(".png") || f.endsWith(".jpg") || f.endsWith(".gif"))
//     })
    let md = await file_as_string(path.join(DOCS_DIR,"menubar.md"))
    // log(md)
    let obj = await parse_markdown(md)
    log(obj)
    let generated = await flatten_html(obj)
    // log(generated)
    page({builddir:OUT_DIR,file:'menubar.html'},html(
        stylesheet("tools/main.css"),
        include_mermaid(),
        body(
            generated,
            execute_mermaid(),
        )
    ))
}
doit().catch(e => console.error(e))