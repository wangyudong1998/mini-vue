import {publicInstanceProxyHandlers} from "./componentPublicInstance";
import {initProps} from "./componentProps";
import {shallowReadonly} from "../reactivity/reactive";
import {emit} from "./componentEmit";
import {initSlots} from "./componentSlots";
import {proxyRefs} from "../reactivity/ref";

export function createComponentInstance(vnode: any, parent) {
    // 返回一个 component 结构的数据
    const component = {
        vnode,
        type: vnode.type,
        setupState: {},
        props: {},
        slots: {},
        parent,
        provides: parent ? Object.create(parent.provides) : {},
        isMounted:false,
        subTree:{},
        emit: () => {}
    }
    component.emit = emit.bind(null, vnode.props) as any
    return component
}

export function setupComponent(instance) {
    initProps(instance, instance.vnode.props)
    initSlots(instance, instance.vnode.children);
    // 处理 setup 的返回值
    setupStatefulComponent(instance)
}

function setupStatefulComponent(instance: any) {
    // 首先获取用户自定义的 setup
    // 通过对初始化的逻辑进行梳理后我们发现，在 createVNode() 函数中将 rootComponent 挂载到了 vNode.type
    // 而 vNode 又通过 instance 挂载到的 instance.vnode 中
    // 所以就可以通过这里传入的 instance.vnode.type 获取到用户定义的 rootComponent
    const component = instance.type
    // 在这里对于 instance 的 this 进行拦截
    instance.proxy = new Proxy(
        {_: instance},
        publicInstanceProxyHandlers
    )

    const {setup} = component
    // 这里需要判断一下，因为用户是不一定会写 setup 的，所以我们要给其一个默认值
    if (setup) {
        // 获取到 setup() 的返回值，这里有两种情况，如果返回的是 function，那么这个 function 将会作为组件的 render
        // 反之就是 setupState，将其注入到上下文中
        // props是不可以被修改的
        // 通过proxyRefs对setup中的ref进行解包
        setCurrentInstance(instance)
        const setupResult = proxyRefs(setup(shallowReadonly(instance.props), {emit: instance.emit}))
        setCurrentInstance(null)
        // 调用初始化结束函数
        handleSetupResult(instance, setupResult)
    }
}


function handleSetupResult(instance, setupResult) {
    if (typeof setupResult === 'object') {
        // 如果是返回值是 object ，就挂载到实例上
        instance.setupState = setupResult
    }
    finishComponentSetup(instance)
}

function finishComponentSetup(instance) {
    const component = instance.type
    if (component.render) {
        instance.render = component.render
    }
}

let currentInstance

function setCurrentInstance(value) {
    currentInstance = value
}

export function getCurrentInstance() {
    return currentInstance
}