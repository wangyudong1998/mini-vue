import {createVNode} from "./vnode";

export function createAppAPI(render){
    return function createApp(rootComponent){
        return {
            mount(rootContainer) {
                // 先将 rootComponent 转为 vnode
                // 后续所有的逻辑操作都会基于vnode做处理
                const vnode = createVNode(rootComponent)
                render(vnode, document.querySelector(rootContainer));
            }
        }
    }
}