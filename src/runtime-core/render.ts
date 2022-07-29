import {createComponentInstance, setupComponent} from "./component";
import {isArray, isObject, isString} from "../shard/index";
import {Fragment, Text} from "./vnode";
import {createAppAPI} from "./createApp";
import {effect} from "../reactivity/effect";

export function createRender(opts) {
    const {
        createElement: hostCreateElement, //创建元素
        patchProp: hostPatchProp,   //添加属性
        insert: hostInsert, //向父元素添加子节点
        selector: hostSelector
    } = opts

    function render(vnode, container) {
        // 调用 patch 方法，对于子节点进行递归处理
        patch(null,vnode, container, null)
    }

    // n1 ->老的虚拟节点 不存在即为初始化 存在代表更新
    // n2 ->新的虚拟节点
    function patch(n1,n2, container, parent) {
        // 判断节点类型
        switch (n2.type) {
            case Fragment: {
                processFragment(n1,n2, container, parent)
                break
            }
            case Text: {
                processText(n1,n2, container)
                break
            }
            default: {
                if (isString(n2.type)) {
                    processElement(n1,n2, container, parent)
                } else if (isObject(n2.type)) {
                    processComponent(n1,n2, container, parent);
                }
                break
            }
        }

    }

    function processText(n1,n2, container) {
        const text = n2.el = document.createTextNode(n2.children)
        container.appendChild(text)
    }

    function processFragment(n1,n2, container, parent) {
        mountChild(n2.children, container, parent)
    }

    function processElement(n1,n2, container, parent) {
        if(!n1){
            mountElement(n2, container, parent)
        }else{
            patchElement(n1,n2,container)
        }
    }
    function patchElement(n1,n2,container){
        console.log('pre:',n1)
        console.log('new:',n2)
    }
    function mountElement(vnode, container, parent) {
        const {type, props, children} = vnode
        let el = vnode.el = hostCreateElement(type)
        for (const key in props) {
            hostPatchProp(el, key, props[key])
        }
        if (isString(children)) {
            el.textContent = children
        } else if (isArray(children)) {
            mountChild(children, el, parent)
        }
        hostInsert(el, container)
    }

    function mountChild(children: any, container: any, parent) {
        children.forEach(v=>{
            patch(null,v, container, parent)
        })
    }

    function processComponent(n1,n2: any, container: any, parent) {
        mountComponent(n2, container, parent)
    }

    function mountComponent(initialVnode: any, container, parent) {
        // 通过vnode创建组件实例
        const instance = createComponentInstance(initialVnode, parent)
        // 组件初始化
        setupComponent(instance)
        setupRenderEffect(initialVnode, instance, container)
    }

    function setupRenderEffect(vnode, instance, container) {
        // 包一层 effect，执行的时候去收集依赖，并在值更新的时候重新渲染视图
        effect(() => {
            // 根据isMounted状态判断是组件否加载过
            if (!instance.isMounted) {
                // init
                const {proxy} = instance
                const subTree = (instance.subTree=instance.render.call(proxy))
                patch(null,subTree, container, instance)
                // 当所有element都mount完后将根结点el赋值到组件的虚拟节点上
                vnode.el = subTree.el
                instance.isMounted=true
            } else {
                // update
                const {proxy} = instance
                const subTree = instance.render.call(proxy)
                // 获取上一个subTree
                const preSubTrue=instance.subTree
                instance.subTree=subTree
                patch(preSubTrue,subTree, container, instance)
            }
        })
    }

    return {
        createApp: createAppAPI(render, hostSelector)
    }
}
