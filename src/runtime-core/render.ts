import {createComponentInstance, setupComponent} from "./component";

export function render(vnode,container){
    // 调用 patch 方法，对于子节点进行递归处理
    patch(vnode,container)
}
function patch(vnode,container){
    // 判断节点类型
    // TODO 先默认为组件类型
    processComponent(vnode,container)
}
function processComponent(vnode:any,container:any){
    mountComponent(vnode,container)
}
function mountComponent(vnode:any,container){
    // 通过vnode创建组件实例
    const instance=createComponentInstance(vnode)
    // 组件初始化
    setupComponent(instance)
    setupRenderEffect(instance,container)
}
function setupRenderEffect(instance,container){
    const subTree=instance.render()
    patch(subTree,container)
}
