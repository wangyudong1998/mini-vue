import {isOn} from "../shard/index";
import {createRender} from "../runtime-core/render";

function createElement(type){
    return document.createElement(type)
}
function patchProp(el,key,props){
    if (isOn(key)) {
        //事件
        let event = key.slice(2).toLowerCase()
        el.addEventListener(event, props[key])
    } else {
        // 属性
        el.setAttribute(key, props[key])
    }
}
function insert(el,container){
    container.appendChild(el)
}
const render:any=createRender({createElement,patchProp,insert})
export function createApp(...arg){
    return render.createApp(...arg)
}
export * from '../runtime-core/index'
