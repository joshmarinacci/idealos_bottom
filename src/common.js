// fetch_resource('name')
export const sleep = (dur) => new Promise((res, rej) => setTimeout(res, dur))
export const genid = (prefix)  => prefix+"_"+Math.floor(Math.random()*1000*1000)

