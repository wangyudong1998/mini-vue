function createVNode(type, props, child) {
    return {
        type,
        props,
        child
    };
}

function createComponentInstance(vnode) {
    // 返回一个 component 结构的数据
    const component = {
        vnode,
        type: vnode.type
    };
    return component;
}
function setupComponent(instance) {
    // TODO initProps()
    // TODO initSlots()
    // 处理 setup 的返回值
    setupStatefulComponent(instance);
}
function setupStatefulComponent(instance) {
    // 首先获取用户自定义的 setup
    // 通过对初始化的逻辑进行梳理后我们发现，在 createVNode() 函数中将 rootComponent 挂载到了 vNode.type
    // 而 vNode 又通过 instance 挂载到的 instance.vnode 中
    // 所以就可以通过这里传入的 instance.vnode.type 获取到用户定义的 rootComponent
    const component = instance.vnode.type;
    const { setup } = component;
    // 这里需要判断一下，因为用户是不一定会写 setup 的，所以我们要给其一个默认值
    if (setup) {
        // 获取到 setup() 的返回值，这里有两种情况，如果返回的是 function，那么这个 function 将会作为组件的 render
        // 反之就是 setupState，将其注入到上下文中
        const setupResult = setup();
        // 调用初始化结束函数
        handleSetupResult(instance, setupResult);
    }
}
function handleSetupResult(instance, setupResult) {
    if (typeof setupResult === 'object') {
        // 如果是返回值是 object ，就挂载到实例上
        instance.setupState = setupResult;
    }
    finishComponentSetup(instance);
}
function finishComponentSetup(instance) {
    const component = instance.type;
    if (component.render) {
        instance.render = component.render;
    }
}

function render(vnode, container) {
    // 调用 patch 方法，对于子节点进行递归处理
    patch(vnode);
}
function patch(vnode, container) {
    // 判断节点类型
    if (typeof vnode.type === 'string') ;
    else if (typeof vnode.type === 'object') {
        processComponent(vnode);
    }
}
function processComponent(vnode, container) {
    mountComponent(vnode);
}
function mountComponent(vnode, container) {
    // 通过vnode创建组件实例
    const instance = createComponentInstance(vnode);
    // 组件初始化
    setupComponent(instance);
    setupRenderEffect(instance);
}
function setupRenderEffect(instance, container) {
    const subTree = instance.render();
    patch(subTree);
}

function createApp(rootComponent) {
    return {
        mount(rootContainer) {
            // 先将 rootComponent 转为 vnode
            // 后续所有的逻辑操作都会基于vnode做处理
            const vnode = createVNode(rootComponent);
            render(vnode, document.querySelector(rootContainer));
        }
    };
}

function h(type, props, child) {
    return createVNode(type, props, child);
}

export { createApp, h };
