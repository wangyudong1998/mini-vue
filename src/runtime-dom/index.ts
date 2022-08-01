import {isOn} from "../shard/index";
import {createRender} from "../runtime-core/render";

function createElement(type){
    return document.createElement(type)
}
function patchProp(el,key,prevVal,nextVal){
    if (isOn(key)) {
        //事件
        let event = key.slice(2).toLowerCase()
        el.addEventListener(event,nextVal)
    } else {
        // 属性
        if(nextVal===null||nextVal===undefined){
            el.removeAttribute(key)
        }else{
            el.setAttribute(key,nextVal)
        }
    }
}
function insert(el,container){
    container.appendChild(el)
}
function selector(container){
    return document.querySelector(container)
}
//将自己实现的 DOM API 传入 createRenderer 创建渲染器
const render:any=createRender({createElement,patchProp,insert,selector})
// 暴露出createApp
export function createApp(...arg){
    return render.createApp(...arg)
}
export * from '../runtime-core/index'
