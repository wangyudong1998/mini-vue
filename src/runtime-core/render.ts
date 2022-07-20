import {createComponentInstance, setupComponent} from "./component";
import {isArray, isObject, isString} from "../shard/index";

export function render(vnode, container) {
    // 调用 patch 方法，对于子节点进行递归处理
    patch(vnode, container)
}


function patch(vnode, container) {
    // 判断节点类型
    if (isString(vnode.type)) {
        processElement(vnode, container)
    } else if (isObject(vnode.type)) {
        processComponent(vnode, container);
    }
}


function processElement(vnode, container) {
    mountElement(vnode, container)
}

function mountElement(vnode, container) {
    const {type, props, child} = vnode
    let el = document.createElement(type)
    for (const propKey in props) {
        el.setAttribute(propKey,props[propKey])
    }
    if (isString(child)) {
        el.textContent = child
    } else if (isArray(child)) {
        mountChild(child, el)
    }
    container.appendChild(el)
}

function mountChild(child: any, container: any) {
    for (const childElement of child) {
        patch(childElement,container)
    }
}

function processComponent(vnode: any, container: any) {
    mountComponent(vnode, container)
}

function mountComponent(vnode: any, container) {
    // 通过vnode创建组件实例
    const instance = createComponentInstance(vnode)
    // 组件初始化
    setupComponent(instance)
    setupRenderEffect(instance, container)
}

function setupRenderEffect(instance, container) {
    const subTree = instance.render()
    patch(subTree, container)
}
