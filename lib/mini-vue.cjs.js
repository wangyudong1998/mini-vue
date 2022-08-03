'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

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
function hasChanged(value, newValue) {
    return !Object.is(value, newValue);
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
    '$el': (i) => i.vnode.el,
    '$slots': (i) => i.slots
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

function initProps(instance, props) {
    instance.props = props || {};
}

let activeEffect;
//是否应该收集依赖
let shouldTrack = false;
class ReactiveEffect {
    constructor(fn, scheduler) {
        // [stop] 该 effect 是否调用过 stop 方法了
        // true 未调用 false 调用
        this.active = true;
        this.deps = [];
        this._fn = fn;
        this.scheduler = scheduler;
    }
    run() {
        if (!this.active) {
            return this._fn();
        }
        // 应该收集
        shouldTrack = true;
        activeEffect = this;
        const r = this._fn();
        //reset
        shouldTrack = false;
        return r;
    }
    stop() {
        if (this.active) {
            cleanupEffect(this);
        }
        if (this.onStop) {
            this.onStop();
        }
        this.active = false;
    }
}
function cleanupEffect(effect) {
    effect.deps.forEach((dep) => {
        dep.delete(effect);
    });
    effect.deps.length = 0;
}
function effect(fn, options = {}) {
    const _effect = new ReactiveEffect(fn, options.scheduler);
    extend(_effect, options);
    _effect.run();
    const runner = _effect.run.bind(_effect);
    runner.effect = _effect;
    return runner;
}
const targetMap = new WeakMap();
function isTracking() {
    return shouldTrack && activeEffect !== undefined;
}
function track(target, key) {
    if (!isTracking())
        return;
    let depsMap = targetMap.get(target);
    if (!depsMap) {
        depsMap = new Map();
        targetMap.set(target, depsMap);
    }
    let dep = depsMap.get(key);
    if (!dep) {
        dep = new Set();
        depsMap.set(key, dep);
    }
    trackEffect(dep);
}
function trackEffect(dep) {
    if (dep.has(activeEffect))
        return;
    dep.add(activeEffect);
    activeEffect.deps.push(dep);
}
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
        // 在 get 时收集依赖
        if (!isReadonly) {
            track(target, key);
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

function initSlots(instance, children) {
    if (!children)
        return;
    //只传了一个h
    if (children.vnode) {
        // 默认插槽
        instance.slots.default = [children];
        return;
    }
    //传了一个数组
    if (isArray(children)) {
        // 默认插槽
        instance.slots.default = children;
        return;
    }
    // 对象
    for (const slotKey in children) {
        // 具名插槽
        // instance.slots[slotKey]=normalizeSlotValue(children[slotKey])
        //作用域插槽
        instance.slots[slotKey] = (props) => normalizeSlotValue(children[slotKey](props));
    }
}
function normalizeSlotValue(value) {
    return isArray(value) ? value : [value];
}

class RefImpl {
    constructor(value) {
        this.dep = new Set();
        this._rawValue = value;
        this._value = convert(value);
        this["__v_isRef" /* RefFlags.IS_REF */] = true;
    }
    get value() {
        if (isTracking()) {
            trackEffect(this.dep);
        }
        return this._value;
    }
    set value(newValue) {
        if (hasChanged(this._rawValue, newValue)) {
            this._rawValue = newValue;
            this._value = convert(newValue);
            triggerEffect(this.dep);
        }
    }
}
function convert(value) {
    // value值为对象时转成reactive对象
    return isObject(value) ? reactive(value) : value;
}
function ref(value) {
    return new RefImpl(value);
}
function isRef(ref) {
    return !!ref['__v_isRef'];
}
function unRef(ref) {
    return isRef(ref) ? ref.value : ref;
}
function proxyRefs(objectWithRef) {
    return new Proxy(objectWithRef, {
        get(target, key, receiver) {
            return unRef(Reflect.get(target, key, receiver));
        },
        set(target, key, value, receiver) {
            // set 分为两种情况，如果原来的值是 ref，并且新的值不是 ref
            // 那么就去更新原来的 ref.value = newValue
            // 第二种情况就是原来的值是 ref，newValue 也是一个 ref
            // 那么就直接替换就 OK 了
            if (isRef(target[key]) && !isRef(value)) {
                return (target[key].value = value);
            }
            else {
                return Reflect.set(target, key, value, receiver);
            }
        }
    });
}

function createComponentInstance(vnode, parent) {
    // 返回一个 component 结构的数据
    const component = {
        vnode,
        type: vnode.type,
        setupState: {},
        props: {},
        slots: {},
        parent,
        provides: parent ? Object.create(parent.provides) : {},
        isMounted: false,
        subTree: {},
        emit: () => { }
    };
    component.emit = emit.bind(null, vnode.props);
    return component;
}
function setupComponent(instance) {
    initProps(instance, instance.vnode.props);
    initSlots(instance, instance.vnode.children);
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
        setCurrentInstance(instance);
        const setupResult = setup(shallowReadonly(instance.props), { emit: instance.emit });
        setCurrentInstance(null);
        // 调用初始化结束函数
        handleSetupResult(instance, setupResult);
    }
}
function handleSetupResult(instance, setupResult) {
    if (typeof setupResult === 'object') {
        // 如果是返回值是 object ，就挂载到实例上
        // 通过proxyRefs对setup中的ref进行解包
        instance.setupState = proxyRefs(setupResult);
    }
    finishComponentSetup(instance);
}
function finishComponentSetup(instance) {
    const component = instance.type;
    if (component.render) {
        instance.render = component.render;
    }
}
let currentInstance;
function setCurrentInstance(value) {
    currentInstance = value;
}
function getCurrentInstance() {
    return currentInstance;
}

const Fragment = Symbol('Fragment');
const Text = Symbol('Text');
function createVNode(type, props, children) {
    return {
        type,
        props,
        children,
        el: null
    };
}
function createTextVNode(text) {
    return createVNode(Text, {}, text);
}

function createAppAPI(render, selector) {
    return function createApp(rootComponent) {
        return {
            mount(rootContainer) {
                // 先将 rootComponent 转为 vnode
                // 后续所有的逻辑操作都会基于vnode做处理
                const vnode = createVNode(rootComponent);
                // 如果传过来了 selector，就用 selector 方法来获取 rootContainer
                // 如果没有传 selector，就直接用 rootContainer
                render(vnode, selector ? selector(rootContainer) : rootContainer);
            }
        };
    };
}

function createRender(opts) {
    const { createElement: hostCreateElement, //创建元素
    patchProp: hostPatchProp, //添加属性
    insert: hostInsert, //向父元素添加子节点
    selector: hostSelector, //获取根结点
    remove: hostRemove, //删除子节点
    setElementText: hostSetElementText, //设置文本节点
     } = opts;
    function render(vnode, container) {
        // 调用 patch 方法，对于子节点进行递归处理
        patch(null, vnode, container, null);
    }
    // n1 ->老的虚拟节点 不存在即为初始化 存在代表更新
    // n2 ->新的虚拟节点
    function patch(n1, n2, container, parent) {
        // 判断节点类型
        switch (n2.type) {
            case Fragment: {
                processFragment(n1, n2, container, parent);
                break;
            }
            case Text: {
                processText(n1, n2, container);
                break;
            }
            default: {
                if (isString(n2.type)) {
                    processElement(n1, n2, container, parent);
                }
                else if (isObject(n2.type)) {
                    processComponent(n1, n2, container, parent);
                }
                break;
            }
        }
    }
    function processText(n1, n2, container) {
        const text = n2.el = document.createTextNode(n2.children);
        container.appendChild(text);
    }
    function processFragment(n1, n2, container, parent) {
        mountChild(n2.children, container, parent);
    }
    function processElement(n1, n2, container, parent) {
        if (!n1) {
            mountElement(n2, container, parent);
        }
        else {
            patchElement(n1, n2, container, parent);
        }
    }
    function patchElement(n1, n2, container, parent) {
        const oldProps = n1.props || {};
        const newProps = n2.props || {};
        // 这里需要传递 el，我们需要考虑一点，到这一层的时候
        // n2.el 是 undefined，所以我们需要把 n1.el 赋给 n2.el
        // 这是因为在下次 patch 的时候 n2 === n1, 此刻的新节点变成旧节点，el 就生效了
        const el = n2.el = n1.el;
        patchProp(el, oldProps, newProps);
        patchChildren(n1, n2, container, parent);
    }
    function patchChildren(n1, n2, container, parent) {
        // 新节点是文本
        if (isString(n2.children)) {
            // 老节点是数组  Array -> Text 先清空原有children  再挂载新的文本
            if (isArray(n1.children)) {
                unmountChildren(n1.children);
            }
            // 老节点是文本 Text -> Text 两者不相等时更新节点（老节点是数组时也会走这里）
            if (n1.children !== n2.children) {
                hostSetElementText(n2.el, n2.children);
            }
        }
        else {
            // 新节点是数组
            //老节点是文本时 Text->Array 清空Text并挂载新节点
            if (isString(n1.children)) {
                hostSetElementText(n1.el, '');
                mountChild(n2.children, container, parent);
            }
        }
    }
    function unmountChildren(children) {
        // 遍历children并清空
        for (const child of children) {
            hostRemove(child.el);
        }
    }
    function patchProp(el, oldProps, newProps) {
        for (const key in newProps) {
            const prevProp = oldProps[key];
            const nextProp = newProps[key];
            // 新旧属性进行对比，如果不相等,走更新逻辑
            if (prevProp !== newProps) {
                hostPatchProp(el, key, prevProp, nextProp);
            }
        }
        for (const key in oldProps) {
            //old 存在，new 不存在，走删除逻辑
            if (!(key in newProps)) {
                hostPatchProp(el, key, oldProps[key], null);
            }
        }
    }
    function mountElement(vnode, container, parent) {
        const { type, props, children } = vnode;
        let el = vnode.el = hostCreateElement(type);
        for (const key in props) {
            hostPatchProp(el, key, null, props[key]);
        }
        if (isString(children)) {
            el.textContent = children;
        }
        else if (isArray(children)) {
            mountChild(children, el, parent);
        }
        hostInsert(el, container);
    }
    function mountChild(children, container, parent) {
        children.forEach(v => {
            patch(null, v, container, parent);
        });
    }
    function processComponent(n1, n2, container, parent) {
        mountComponent(n2, container, parent);
    }
    function mountComponent(initialVnode, container, parent) {
        // 通过vnode创建组件实例
        const instance = createComponentInstance(initialVnode, parent);
        // 组件初始化
        setupComponent(instance);
        setupRenderEffect(initialVnode, instance, container);
    }
    function setupRenderEffect(vnode, instance, container) {
        // 包一层 effect，执行的时候去收集依赖，并在值更新的时候重新渲染视图
        effect(() => {
            // 根据isMounted状态判断是组件否加载过
            if (!instance.isMounted) {
                // init
                const { proxy } = instance;
                // 通过组件实例上的proxy改变render函数的this指向
                const subTree = (instance.subTree = instance.render.call(proxy));
                patch(null, subTree, container, instance);
                // 当所有element都mount完后将根结点el赋值到组件的虚拟节点上
                vnode.el = subTree.el;
                instance.isMounted = true;
            }
            else {
                // update
                const { proxy } = instance;
                const subTree = instance.render.call(proxy);
                // 获取上一个subTree
                const preSubTrue = instance.subTree;
                instance.subTree = subTree;
                patch(preSubTrue, subTree, container, instance);
            }
        });
    }
    return {
        createApp: createAppAPI(render, hostSelector)
    };
}

function h(type, props, children) {
    return createVNode(type, props, children);
}

function renderSlots(slots, name = 'default', prop) {
    const slot = slots[name];
    if (slot) {
        if (name === 'default') {
            return h(Fragment, null, slot);
        }
        else {
            return h(Fragment, null, slot(prop));
        }
    }
}

function provide(key, value) {
    const instance = getCurrentInstance();
    if (instance) {
        const { provides } = instance;
        provides[key] = value;
    }
}
function inject(key) {
    const instance = getCurrentInstance();
    if (instance) {
        const { parent } = instance;
        return parent.provides[key];
    }
}

function createElement(type) {
    return document.createElement(type);
}
function patchProp(el, key, prevVal, nextVal) {
    if (isOn(key)) {
        //事件
        let event = key.slice(2).toLowerCase();
        el.addEventListener(event, nextVal);
    }
    else {
        // 属性
        if (nextVal === null || nextVal === undefined) {
            el.removeAttribute(key);
        }
        else {
            el.setAttribute(key, nextVal);
        }
    }
}
function insert(el, container) {
    container.appendChild(el);
}
function remove(child) {
    // 获取到父节点，【parentNode 是 DOM API】
    const parentElement = child.parentNode;
    if (parentElement) {
        parentElement.removeChild(child);
    }
}
function setElementText(el, text) {
    el.textContent = text;
}
function selector(container) {
    return document.querySelector(container);
}
//将自己实现的 DOM API 传入 createRenderer 创建渲染器
const render = createRender({ createElement, patchProp, insert, selector, remove, setElementText });
// 暴露出createApp
function createApp(...arg) {
    return render.createApp(...arg);
}

exports.createApp = createApp;
exports.createRender = createRender;
exports.createTextVNode = createTextVNode;
exports.getCurrentInstance = getCurrentInstance;
exports.h = h;
exports.inject = inject;
exports.provide = provide;
exports.ref = ref;
exports.renderSlots = renderSlots;
