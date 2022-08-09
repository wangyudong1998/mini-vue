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
        key: props && props.key,
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
        patch(null, vnode, container, null, null);
    }
    // n1 ->老的虚拟节点 不存在即为初始化 存在代表更新
    // n2 ->新的虚拟节点
    function patch(n1, n2, container, parent, anchor) {
        // 判断节点类型
        switch (n2.type) {
            case Fragment: {
                processFragment(n1, n2, container, parent, anchor);
                break;
            }
            case Text: {
                processText(n1, n2, container);
                break;
            }
            default: {
                if (isString(n2.type)) {
                    processElement(n1, n2, container, parent, anchor);
                }
                else if (isObject(n2.type)) {
                    processComponent(n1, n2, container, parent, anchor);
                }
                break;
            }
        }
    }
    function processText(n1, n2, container) {
        const text = n2.el = document.createTextNode(n2.children);
        container.appendChild(text);
    }
    function processFragment(n1, n2, container, parent, anchor) {
        mountChild(n2.children, container, parent, anchor);
    }
    function processElement(n1, n2, container, parent, anchor) {
        if (!n1) {
            mountElement(n2, container, parent, anchor);
        }
        else {
            patchElement(n1, n2, container, parent, anchor);
        }
    }
    function patchElement(n1, n2, container, parent, anchor) {
        const oldProps = n1.props || {};
        const newProps = n2.props || {};
        // 这里需要传递 el，我们需要考虑一点，到这一层的时候
        // n2.el 是 undefined，所以我们需要把 n1.el 赋给 n2.el
        // 这是因为在下次 patch 的时候 n2 === n1, 此刻的新节点变成旧节点，el 就生效了
        const el = n2.el = n1.el;
        patchProp(el, oldProps, newProps);
        patchChildren(n1, n2, el, parent, anchor);
    }
    function patchChildren(n1, n2, container, parent, anchor) {
        const c1 = n1.children;
        const c2 = n2.children;
        // 新节点是文本
        if (isString(c1)) {
            // 老节点是数组  Array -> Text 先清空原有children  再挂载新的文本
            if (isArray(c1)) {
                unmountChildren(c1);
            }
            // 老节点是文本 Text -> Text 两者不相等时更新节点（老节点是数组时也会走这里）
            if (c1 !== c2) {
                hostSetElementText(n2.el, c2);
            }
        }
        else {
            // 新节点是数组
            //老节点是文本时 Text->Array 清空Text并挂载新节点
            if (isString(c1)) {
                hostSetElementText(n1.el, '');
                mountChild(c2, container, parent, anchor);
            }
            else {
                //老节点是数组  Array->Array
                patchKeyedChildren(c1, c2, container, parent, anchor);
            }
        }
    }
    function patchKeyedChildren(c1, c2, container, parent, anchor) {
        // 声明三个指针，i是当前对比的元素（默认为0），e1是老节点的最后一个元素，e2是新节点的最后一个元素
        const l2 = c2.length;
        let i = 0;
        let e1 = c1.length - 1;
        let e2 = l2 - 1;
        //通过type和key判断两个节点是否相同
        function isSameVNode(n1, n2) {
            return n1.type === n2.type && n1.key === n2.key;
        }
        // 左端对比
        // 从头部开始对比，如果当前对比的 vnode 相同
        // 就进入 patch 阶段，如果不相等，直接中断掉这个循环
        while (i <= e1 && i <= e2) {
            if (isSameVNode(c1[i], c2[i])) {
                patch(c1[i], c2[i], container, parent, anchor);
            }
            else {
                break;
            }
            i++;
        }
        // 右端对比
        //从尾部开始对比
        while (i <= e1 && i <= e2) {
            if (isSameVNode(c1[e1], c2[e2])) {
                patch(c1[e1], c2[e2], container, parent, anchor);
            }
            else {
                break;
            }
            e1--;
            e2--;
        }
        // 前后对比结束
        //新节点比老节点多 新增新节点
        if (i > e1) {
            if (i <= e2) {
                // nextPos 就是需要追加元素的索引
                // 如果这个新元素的索引已经超过了新节点的长度，那么说明是追加到尾部 anchor = null
                // 如果没有超过新节点的长度，那么就是插入到某个位置
                // 此时 anchor = c2[nextPos].el，也就是这个新加元素的下一个元素
                const nextPos = e2 + 1;
                const anchor = nextPos < l2 ? c2[nextPos].el : null;
                while (i <= e2) {
                    patch(null, c2[i], container, parent, anchor);
                    i++;
                }
            }
        }
        else if (i > e2) { //新节点比老节点少 删除老节点
            if (i <= e1) {
                while (i <= e1) {
                    hostRemove(c1[i].el);
                    i++;
                }
            }
        }
        else {
            // 中间对比
            const s1 = i;
            const s2 = i;
            //需要patch的新节点的数量
            const toBePatched = e2 - s2 + 1;
            //已经patch过的节点个数
            let patched = 0;
            // 新的节点(c2)中混乱的节点
            const keyToNewIndexMap = new Map();
            // 是否应该移动
            let shouldMove = false;
            // 目前最大的索引
            let maxNewIndexSoFar = 0;
            // 储存旧节点混乱元素的索引，创建定长数组，性能更好
            const newIndexToOldIndexMap = new Array(toBePatched);
            // 循环初始化每一项索引，0 表示未建立映射关系
            for (let i = 0; i < toBePatched; i++)
                newIndexToOldIndexMap[i] = 0;
            // 给混乱节点添加映射
            for (let i = s2; i <= e2; i++) {
                const nextChild = c2[i];
                if (nextChild.key) {
                    keyToNewIndexMap.set(nextChild.key, i);
                }
            }
            //循环老的节点
            for (let i = s1; i <= e1; i++) {
                const preChild = c1[i];
                let newIndex;
                if (patched >= toBePatched) {
                    // 如果当前 patched 的个数 >= 应该 patched 的个数
                    // 那么直接删除
                    hostRemove(preChild.el);
                    continue;
                }
                // 如果当前老节点存在key 则去映射中查找对应的新节点的index
                if (preChild.key) {
                    newIndex = keyToNewIndexMap.get(preChild.key);
                }
                else {
                    //如果老节点没有key 则需要重新遍历新节点 查找相同节点的索引
                    for (let j = s2; j <= e2; j++) {
                        if (isSameVNode(preChild, c2[j])) {
                            newIndex = j;
                            break;
                        }
                    }
                }
                //如果新节点中不存在对应的老节点，就删除老节点
                if (newIndex === undefined) {
                    hostRemove(preChild.el);
                }
                else {
                    // 在储存索引的时候
                    // 判断是否需要移动
                    // 如果说当前的索引 >= 记录的最大索引
                    if (newIndex >= maxNewIndexSoFar) {
                        // 就把当前的索引给到最大的索引
                        maxNewIndexSoFar = newIndex;
                    }
                    else {
                        // 否则就不是一直递增，那么就是需要移动的
                        shouldMove = true;
                    }
                    // 确定新节点存在，储存索引映射关系
                    // newIndex 获取到当前老节点在新节点中的元素，减去 s2 是要将整个混乱的部分拆开，索引归于 0
                    // 为什么是 i + 1 是因为需要考虑 i 是 0 的情况，因为我们的索引映射表中 0 表示的是初始化状态
                    // 所以不能是 0，因此需要用到 i + 1
                    newIndexToOldIndexMap[newIndex - s2] = i + 1;
                    // 如果存在，则进入patch阶段 继续递归对比
                    patch(preChild, c2[newIndex], container, parent, null);
                    patched++;
                }
            }
            // 获取最长递增子序列索引
            const increasingNewIndexSequence = shouldMove ? getSequence(newIndexToOldIndexMap) : [];
            let j = increasingNewIndexSequence.length - 1;
            for (let i = toBePatched - 1; i >= 0; i--) {
                // 获取元素的索引
                const nextIndex = i + s2;
                // 获取到需要插入的元素
                const nextChild = c2[nextIndex];
                // 获取锚点
                const anchor = nextIndex + 1 < l2 ? c2[nextIndex + 1].el : null;
                // 如果说某一项是0，证明这一项在旧节点中不存在，那么就需要创建了
                if (newIndexToOldIndexMap[i] === 0) {
                    patch(null, nextChild, container, parent, anchor);
                }
                else if (shouldMove) {
                    if (j <= 0 || i !== increasingNewIndexSequence[j]) {
                        // 移动
                        hostInsert(nextChild.el, container, anchor);
                    }
                    else {
                        j--;
                    }
                }
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
    function mountElement(vnode, container, parent, anchor) {
        const { type, props, children } = vnode;
        let el = vnode.el = hostCreateElement(type);
        for (const key in props) {
            hostPatchProp(el, key, null, props[key]);
        }
        if (isString(children)) {
            el.textContent = children;
        }
        else if (isArray(children)) {
            mountChild(children, el, parent, anchor);
        }
        hostInsert(el, container, anchor);
    }
    function mountChild(children, container, parent, anchor) {
        children.forEach(v => {
            patch(null, v, container, parent, anchor);
        });
    }
    function processComponent(n1, n2, container, parent, anchor) {
        mountComponent(n2, container, parent, anchor);
    }
    function mountComponent(initialVnode, container, parent, anchor) {
        // 通过vnode创建组件实例
        const instance = createComponentInstance(initialVnode, parent);
        // 组件初始化
        setupComponent(instance);
        setupRenderEffect(initialVnode, instance, container, anchor);
    }
    function setupRenderEffect(vnode, instance, container, anchor) {
        // 包一层 effect，执行的时候去收集依赖，并在值更新的时候重新渲染视图
        effect(() => {
            // 根据isMounted状态判断是组件否加载过
            if (!instance.isMounted) {
                // init
                const { proxy } = instance;
                // 通过组件实例上的proxy改变render函数的this指向
                const subTree = (instance.subTree = instance.render.call(proxy));
                patch(null, subTree, container, instance, anchor);
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
                patch(preSubTrue, subTree, container, instance, anchor);
            }
        });
    }
    return {
        createApp: createAppAPI(render, hostSelector)
    };
}
function getSequence(arr) {
    const p = arr.slice();
    const result = [0];
    let i, j, u, v, c;
    const len = arr.length;
    for (i = 0; i < len; i++) {
        const arrI = arr[i];
        if (arrI !== 0) {
            j = result[result.length - 1];
            if (arr[j] < arrI) {
                p[i] = j;
                result.push(i);
                continue;
            }
            u = 0;
            v = result.length - 1;
            while (u < v) {
                c = (u + v) >> 1;
                if (arr[result[c]] < arrI) {
                    u = c + 1;
                }
                else {
                    v = c;
                }
            }
            if (arrI < arr[result[u]]) {
                if (u > 0) {
                    p[i] = result[u - 1];
                }
                result[u] = i;
            }
        }
    }
    u = result.length;
    v = result[u - 1];
    while (u-- > 0) {
        result[u] = v;
        v = p[v];
    }
    return result;
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
function insert(el, container, anchor) {
    // [insertBefore] 在某个子元素前插入,为null时默认在结尾插入
    container.insertBefore(el, anchor || null);
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
