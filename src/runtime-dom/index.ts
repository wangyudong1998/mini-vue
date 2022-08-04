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
function insert(el,container,anchor){
    // [insertBefore] 在某个子元素前插入,为null时默认在结尾插入
    container.insertBefore(el, anchor || null)
}

function remove(child){
    // 获取到父节点，【parentNode 是 DOM API】
    const parentElement=child.parentNode
    if(parentElement){
        parentElement.removeChild(child)
    }
}
function setElementText(el,text){
    el.textContent=text
}

function selector(container){
    return document.querySelector(container)
}

//将自己实现的 DOM API 传入 createRenderer 创建渲染器
const render:any=createRender({createElement,patchProp,insert,selector,remove,setElementText})
// 暴露出createApp
export function createApp(...arg){
    return render.createApp(...arg)
}
export * from '../runtime-core/index'
