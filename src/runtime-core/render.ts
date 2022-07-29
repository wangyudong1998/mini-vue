import {createComponentInstance, setupComponent} from "./component";
import {isArray, isObject, isString} from "../shard/index";
import {Fragment, Text} from "./vnode";
import {createAppAPI} from "./createApp";

export function createRender(opts) {
    const {
        createElement: hostCreateElement, //创建元素
        patchProp: hostPatchProp,   //添加属性
        insert: hostInsert, //向父元素添加子节点
        selector:hostSelector
    } = opts

    function render(vnode, container) {
        // 调用 patch 方法，对于子节点进行递归处理
        patch(vnode, container, null)
    }


    function patch(vnode, container, parent) {
        // 判断节点类型
        switch (vnode.type) {
            case Fragment: {
                processFragment(vnode, container, parent)
                break
            }
            case Text: {
                processText(vnode, container)
                break
            }
            default: {
                if (isString(vnode.type)) {
                    processElement(vnode, container, parent)
                } else if (isObject(vnode.type)) {
                    processComponent(vnode, container, parent);
                }
                break
            }
        }

    }

    function processText(vnode, container) {
        const text = vnode.el = document.createTextNode(vnode.children)
        container.appendChild(text)
    }

    function processFragment(vnode, container, parent) {
        mountChild(vnode.children, container, parent)
    }

    function processElement(vnode, container, parent) {
        mountElement(vnode, container, parent)
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
        for (const childElement of children) {
            patch(childElement, container, parent)
        }
    }

    function processComponent(vnode: any, container: any, parent) {
        mountComponent(vnode, container, parent)
    }

    function mountComponent(initialVnode: any, container, parent) {
        // 通过vnode创建组件实例
        const instance = createComponentInstance(initialVnode, parent)
        // 组件初始化
        setupComponent(instance)
        setupRenderEffect(initialVnode, instance, container)
    }

    function setupRenderEffect(vnode, instance, container) {
        const {proxy} = instance
        const subTree = instance.render.call(proxy)
        patch(subTree, container, instance)
        // 当所有element都mount 完后将根结点el赋值到组件的虚拟节点上
        vnode.el = subTree.el
    }

    return {
        createApp: createAppAPI(render,hostSelector)
    }
}
