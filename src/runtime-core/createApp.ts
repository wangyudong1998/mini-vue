import {createVNode} from "./vnode";

export function createAppAPI(render,selector?){
    return function createApp(rootComponent){
        return {
            mount(rootContainer) {
                // 先将 rootComponent 转为 vnode
                // 后续所有的逻辑操作都会基于vnode做处理
                const vnode = createVNode(rootComponent)
                // 如果传过来了 selector，就用 selector 方法来获取 rootContainer
                // 如果没有传 selector，就直接用 rootContainer
                render(vnode, selector?selector(rootContainer):rootContainer);
            }
        }
    }
}