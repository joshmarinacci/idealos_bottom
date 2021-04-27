import {make_element} from 'static-build-tools'
import fs from 'fs'

export const file_as_string = (pth) => fs.promises.readFile(pth).then(b => b.toString())

export function log(...args) {
    console.log(...args)
}

export const html = make_element('html')
export const body = make_element('body')
const h1 = make_element('h1')
export const link = make_element('link')
export const script = make_element('script')