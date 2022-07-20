import {createVNode} from "./vnode";

export function h(type,props,child) {
    return createVNode(type,props,child)
}