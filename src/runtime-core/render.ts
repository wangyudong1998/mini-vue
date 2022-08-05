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
        selector: hostSelector, //获取根结点
        remove: hostRemove, //删除子节点
        setElementText: hostSetElementText, //设置文本节点
    } = opts

    function render(vnode, container) {
        // 调用 patch 方法，对于子节点进行递归处理
        patch(null, vnode, container, null,null)
    }

    // n1 ->老的虚拟节点 不存在即为初始化 存在代表更新
    // n2 ->新的虚拟节点
    function patch(n1, n2, container, parent,anchor) {
        // 判断节点类型
        switch (n2.type) {
            case Fragment: {
                processFragment(n1, n2, container, parent,anchor)
                break
            }
            case Text: {
                processText(n1, n2, container)
                break
            }
            default: {
                if (isString(n2.type)) {
                    processElement(n1, n2, container, parent,anchor)
                } else if (isObject(n2.type)) {
                    processComponent(n1, n2, container, parent,anchor);
                }
                break
            }
        }

    }

    function processText(n1, n2, container) {
        const text = n2.el = document.createTextNode(n2.children)
        container.appendChild(text)
    }

    function processFragment(n1, n2, container, parent,anchor) {
        mountChild(n2.children, container, parent,anchor)
    }

    function processElement(n1, n2, container, parent,anchor) {
        if (!n1) {
            mountElement(n2, container, parent,anchor)
        } else {
            patchElement(n1, n2, container, parent,anchor)
        }
    }

    function patchElement(n1, n2, container, parent,anchor) {
        const oldProps = n1.props || {}
        const newProps = n2.props || {}
        // 这里需要传递 el，我们需要考虑一点，到这一层的时候
        // n2.el 是 undefined，所以我们需要把 n1.el 赋给 n2.el
        // 这是因为在下次 patch 的时候 n2 === n1, 此刻的新节点变成旧节点，el 就生效了
        const el = n2.el = n1.el
        patchProp(el, oldProps, newProps)
        patchChildren(n1, n2, el, parent,anchor)
    }

    function patchChildren(n1, n2, container, parent,anchor) {
        const c1 = n1.children
        const c2 = n2.children

        // 新节点是文本
        if (isString(c1)) {
            // 老节点是数组  Array -> Text 先清空原有children  再挂载新的文本
            if (isArray(c1)) {
                unmountChildren(c1)
            }
            // 老节点是文本 Text -> Text 两者不相等时更新节点（老节点是数组时也会走这里）
            if (c1 !== c2) {
                hostSetElementText(n2.el, c2)
            }
        } else {
            // 新节点是数组
            //老节点是文本时 Text->Array 清空Text并挂载新节点
            if (isString(c1)) {
                hostSetElementText(n1.el, '')
                mountChild(c2, container, parent,anchor)
            } else {
                //老节点是数组  Array->Array
                patchKeyedChildren(c1, c2, container, parent,anchor)
            }
        }
    }

    function patchKeyedChildren(c1, c2, container, parent,anchor) {
        // 声明三个指针，i是当前对比的元素（默认为0），e1是老节点的最后一个元素，e2是新节点的最后一个元素
        let i = 0
        let e1 = c1.length - 1
        let e2 = c2.length - 1

        //通过type和key判断两个节点是否相同
        function isSameVNode(n1, n2) {
            return n1.type === n2.type && n1.key === n2.key
        }

        // 左端对比
        // 从头部开始对比，如果当前对比的 vnode 相同
        // 就进入 patch 阶段，如果不相等，直接中断掉这个循环
        while (i <= e1 && i <= e2) {
            if (isSameVNode(c1[i], c2[i])) {
                patch(c1[i], c2[i], container, parent,anchor)
            } else {
                break
            }
            i++
        }
        // 右端对比
        //从尾部开始对比
        while (i <= e1 && i <= e2) {
            if (isSameVNode(c1[e1], c2[e2])) {
                patch(c1[e1], c2[e2], container, parent,anchor)
            } else {
                break
            }
            e1--
            e2--
        }
        //新节点比老节点多 新增
        if (i >e1) {
            if (i <= e2) {
                // nextPos 就是需要追加元素的索引
                // 如果这个新元素的索引已经超过了新节点的长度，那么说明是追加到尾部 anchor = null
                // 如果没有超过新节点的长度，那么就是插入到某个位置
                // 此时 anchor = c2[nextPos].el，也就是这个新加元素的下一个元素
                const nextPos=e2+1
                const anchor=nextPos<c2.length?c2[nextPos].el:null
                while (i <= e2) {
                    patch(null, c2[i], container, parent,anchor)
                    i++
                }
            }
        }else if(i>e2){ //老节点比新节点少 删除
            if(i<=e1){
                while(i<=e1){
                    hostRemove(c1[i].el)
                    i++
                }
            }
        }
    }

    function unmountChildren(children) {
        // 遍历children并清空
        for (const child of children) {
            hostRemove(child.el)
        }
    }

    function patchProp(el, oldProps, newProps) {
        for (const key in newProps) {
            const prevProp = oldProps[key]
            const nextProp = newProps[key]
            // 新旧属性进行对比，如果不相等,走更新逻辑
            if (prevProp !== newProps) {
                hostPatchProp(el, key, prevProp, nextProp)
            }
        }
        for (const key in oldProps) {
            //old 存在，new 不存在，走删除逻辑
            if (!(key in newProps)) {
                hostPatchProp(el, key, oldProps[key], null)
            }
        }
    }

    function mountElement(vnode, container, parent,anchor) {
        const {type, props, children} = vnode
        let el = vnode.el = hostCreateElement(type)
        for (const key in props) {
            hostPatchProp(el, key, null, props[key])
        }
        if (isString(children)) {
            el.textContent = children
        } else if (isArray(children)) {
            mountChild(children, el, parent,anchor)
        }
        hostInsert(el, container,anchor)
    }

    function mountChild(children: any, container: any, parent,anchor) {
        children.forEach(v => {
            patch(null, v, container, parent,anchor)
        })
    }

    function processComponent(n1, n2: any, container: any, parent,anchor) {
        mountComponent(n2, container, parent,anchor)
    }

    function mountComponent(initialVnode: any, container, parent,anchor) {
        // 通过vnode创建组件实例
        const instance = createComponentInstance(initialVnode, parent)
        // 组件初始化
        setupComponent(instance)
        setupRenderEffect(initialVnode, instance, container,anchor)
    }

    function setupRenderEffect(vnode, instance, container,anchor) {
        // 包一层 effect，执行的时候去收集依赖，并在值更新的时候重新渲染视图
        effect(() => {
            // 根据isMounted状态判断是组件否加载过
            if (!instance.isMounted) {
                // init
                const {proxy} = instance
                // 通过组件实例上的proxy改变render函数的this指向
                const subTree = (instance.subTree = instance.render.call(proxy))
                patch(null, subTree, container, instance,anchor)
                // 当所有element都mount完后将根结点el赋值到组件的虚拟节点上
                vnode.el = subTree.el
                instance.isMounted = true
            } else {
                // update
                const {proxy} = instance
                const subTree = instance.render.call(proxy)
                // 获取上一个subTree
                const preSubTrue = instance.subTree
                instance.subTree = subTree
                patch(preSubTrue, subTree, container, instance,anchor)
            }
        })
    }

    return {
        createApp: createAppAPI(render, hostSelector)
    }
}
