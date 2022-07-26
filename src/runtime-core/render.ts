import {createComponentInstance, setupComponent} from "./component";
import {isArray, isObject, isOn, isString} from "../shard/index";
import {Fragment, Text} from "./vnode";

export function render(vnode, container) {
    // 调用 patch 方法，对于子节点进行递归处理
    patch(vnode, container)
}


function patch(vnode, container) {
    // 判断节点类型
    switch (vnode.type) {
        case Fragment: {
            processFragment(vnode,container)
            break
        }
        case Text:{
            processText(vnode,container)
            break
        }
        default: {
            if (isString(vnode.type)) {
                processElement(vnode, container)
            } else if (isObject(vnode.type)) {
                processComponent(vnode, container);
            }
            break
        }
    }

}

function processText(vnode,container){
    const text=vnode.el=document.createTextNode(vnode.children)
    container.appendChild(text)
}

function processFragment(vnode,container){
    mountChild(vnode.children,container)
}

function processElement(vnode, container) {
    mountElement(vnode, container)
}

function mountElement(vnode, container) {
    const {type, props, children} = vnode
    let el = vnode.el = document.createElement(type)
    for (const propKey in props) {
        //事件
        if (isOn(propKey)) {
            let event = propKey.slice(2).toLowerCase()
            el.addEventListener(event, props[propKey])
        } else {
            el.setAttribute(propKey, props[propKey])
        }
    }
    if (isString(children)) {
        el.textContent = children
    } else if (isArray(children)) {
        mountChild(children, el)
    }
    container.appendChild(el)
}

function mountChild(children: any, container: any) {
    for (const childElement of children) {
        patch(childElement, container)
    }
}

function processComponent(vnode: any, container: any) {
    mountComponent(vnode, container)
}

function mountComponent(initialVnode: any, container) {
    // 通过vnode创建组件实例
    const instance = createComponentInstance(initialVnode)
    // 组件初始化
    setupComponent(instance)
    setupRenderEffect(initialVnode, instance, container)
}

function setupRenderEffect(vnode, instance, container) {
    const {proxy} = instance
    const subTree = instance.render.call(proxy)
    patch(subTree, container)
    // 当所有element都mount 完后将根结点el赋值到组件的虚拟节点上
    vnode.el = subTree.el
}
