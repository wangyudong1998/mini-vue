function createVNode(type, props, child) {
    return {
        type,
        props,
        child,
        el: null
    };
}

const extend = Object.assign;
function isObject(val) {
    return val !== null && typeof val === 'object';
}
function isString(val) {
    return typeof val === 'string';
}
function isArray(val) {
    return Array.isArray(val);
}
function isOn(key) {
    return /^on[A-Z]/.test(key);
}
function hasOwn(obj, key) {
    return Object.prototype.hasOwnProperty.call(obj, key);
}
function capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}
function camelize(str) {
    return str.replace(/-(\w)/g, (_, c) => {
        return c ? c.toUpperCase() : '';
    });
}

const publicPropertiesMap = {
    '$el': (i) => i.vnode.el
};
const publicInstanceProxyHandlers = {
    get({ _: instance }, key) {
        const { setupState, props } = instance;
        if (hasOwn(setupState, key)) {
            if (key in setupState) {
                return setupState[key];
            }
        }
        else if (hasOwn(props, key)) {
            if (key in props) {
                return props[key];
            }
        }
        const publicGetter = publicPropertiesMap[key];
        if (publicGetter) {
            return publicGetter(instance);
        }
    },
};

function initProps(instance) {
    instance.props = instance.vnode.props || {};
}

const targetMap = new WeakMap();
function trigger(target, key) {
    let depsMap = targetMap.get(target);
    let dep = depsMap.get(key);
    triggerEffect(dep);
}
function triggerEffect(dep) {
    for (const depElement of dep) {
        if (depElement.scheduler) {
            depElement.scheduler();
        }
        else {
            depElement.run();
        }
    }
}

const get = createGetter();
const readonlyGet = createGetter(true);
const shallowReadonlyGet = createGetter(true, true);
const set = createSetter();
function createGetter(isReadonly = false, isShallow = false) {
    return function get(target, key, receiver) {
        if (key === "__v_isReactive" /* ReactiveFlags.IS_REACTIVE */) {
            return !isReadonly;
        }
        else if (key === "__v_isReadonly" /* ReactiveFlags.IS_READONLY */) {
            return isReadonly;
        }
        const res = Reflect.get(target, key, receiver);
        if (isShallow) {
            return res;
        }
        //嵌套对象的转换
        if (isObject(res)) {
            return isReadonly ? readonly(res) : reactive(res);
        }
        return res;
    };
}
function createSetter() {
    return function set(target, key, value, receiver) {
        const res = Reflect.set(target, key, value, receiver);
        // 在 set 时触发依赖
        trigger(target, key);
        return res;
    };
}
// mutable 可变的
const mutableHandlers = {
    get,
    set,
};
const readonlyHandlers = {
    get: readonlyGet,
    set(target, key, value) {
        console.warn(`key: ${key} set value: ${value} fail, because the target is readonly`, target);
        return true;
    },
};
const shallowReadonlyHandlers = extend({}, readonlyHandlers, {
    get: shallowReadonlyGet
});

function createActiveObject(raw, baseHandlers) {
    return new Proxy(raw, baseHandlers);
}
function reactive(raw) {
    return createActiveObject(raw, mutableHandlers);
}
function readonly(raw) {
    return createActiveObject(raw, readonlyHandlers);
}
function shallowReadonly(raw) {
    return createActiveObject(raw, shallowReadonlyHandlers);
}

function emit(props, event, ...arg) {
    const handler = props[`on${capitalize(camelize(event))}`];
    console.log(`on${capitalize(camelize(event))}`);
    handler && handler(...arg);
}

function createComponentInstance(vnode) {
    // 返回一个 component 结构的数据
    const component = {
        vnode,
        type: vnode.type,
        setupState: {},
        props: {},
        emit: () => { }
    };
    component.emit = emit.bind(null, vnode.props);
    return component;
}
function setupComponent(instance) {
    initProps(instance);
    // TODO initSlots()
    // 处理 setup 的返回值
    setupStatefulComponent(instance);
}
function setupStatefulComponent(instance) {
    // 首先获取用户自定义的 setup
    // 通过对初始化的逻辑进行梳理后我们发现，在 createVNode() 函数中将 rootComponent 挂载到了 vNode.type
    // 而 vNode 又通过 instance 挂载到的 instance.vnode 中
    // 所以就可以通过这里传入的 instance.vnode.type 获取到用户定义的 rootComponent
    const component = instance.type;
    // 在这里对于 instance 的 this 进行拦截
    instance.proxy = new Proxy({ _: instance }, publicInstanceProxyHandlers);
    const { setup } = component;
    // 这里需要判断一下，因为用户是不一定会写 setup 的，所以我们要给其一个默认值
    if (setup) {
        // 获取到 setup() 的返回值，这里有两种情况，如果返回的是 function，那么这个 function 将会作为组件的 render
        // 反之就是 setupState，将其注入到上下文中
        // props是不可以被修改的
        const setupResult = setup(shallowReadonly(instance.props), { emit: instance.emit });
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
    patch(vnode, container);
}
function patch(vnode, container) {
    // 判断节点类型
    if (isString(vnode.type)) {
        processElement(vnode, container);
    }
    else if (isObject(vnode.type)) {
        processComponent(vnode, container);
    }
}
function processElement(vnode, container) {
    mountElement(vnode, container);
}
function mountElement(vnode, container) {
    const { type, props, child } = vnode;
    let el = vnode.el = document.createElement(type);
    for (const propKey in props) {
        //事件
        if (isOn(propKey)) {
            let event = propKey.slice(2).toLowerCase();
            el.addEventListener(event, props[propKey]);
        }
        else {
            el.setAttribute(propKey, props[propKey]);
        }
    }
    if (isString(child)) {
        el.textContent = child;
    }
    else if (isArray(child)) {
        mountChild(child, el);
    }
    container.appendChild(el);
}
function mountChild(child, container) {
    for (const childElement of child) {
        patch(childElement, container);
    }
}
function processComponent(vnode, container) {
    mountComponent(vnode, container);
}
function mountComponent(initialVnode, container) {
    // 通过vnode创建组件实例
    const instance = createComponentInstance(initialVnode);
    // 组件初始化
    setupComponent(instance);
    setupRenderEffect(initialVnode, instance, container);
}
function setupRenderEffect(vnode, instance, container) {
    const { proxy } = instance;
    const subTree = instance.render.call(proxy);
    patch(subTree, container);
    // 当所有element都mount 完后将根结点el赋值到组件的虚拟节点上
    vnode.el = subTree.el;
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
