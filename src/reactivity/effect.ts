import {extend} from '../shard'

let activeEffect
//是否应该收集依赖
let shouldTrack = false

class ReactiveEffect {
    private _fn: any;
    // [stop] 该 effect 是否调用过 stop 方法了
    // true 未调用 false 调用
    active = true
    deps = []
    public scheduler: Function | undefined
    onStop?: () => void;

    constructor(fn, scheduler?: Function) {
        this._fn = fn
        this.scheduler = scheduler
    }

    run() {
        if (!this.active) {
            return this._fn()
        }

        // 应该收集
        shouldTrack = true
        activeEffect = this
        const r = this._fn()
        //reset
        shouldTrack = false

        return r
    }

    stop() {
        if (this.active) {
            cleanupEffect(this)
        }
    }
}

function cleanupEffect(effect) {
    effect.deps.forEach((dep: any) => {
        dep.delete(effect)
    })
    if (effect.onStop) {
        effect.onStop()
    }
    effect.active = false
    effect.deps.length=0
}

export function effect(fn, options: any = {}) {
    const _effect = new ReactiveEffect(fn)
    extend(_effect, options)
    _effect.run()
    const runner: any = _effect.run.bind(_effect)
    runner.effect = _effect
    return runner
}

export function stop(runner) {
    runner.effect.stop()
}

const targetMap = new WeakMap()

export function track(target, key) {
    let depsMap = targetMap.get(target)
    if (!depsMap) {
        depsMap = new Map()
        targetMap.set(target, depsMap)
    }
    let dep = depsMap.get(key)
    if (!dep) {
        dep = new Set()
        depsMap.set(key, dep)
    }
    if (!activeEffect) return
    if (!shouldTrack) return;
    dep.add(activeEffect)
    activeEffect.deps.push(dep)
}

export function trigger(target, key) {
    let depsMap = targetMap.get(target)
    let dep = depsMap.get(key)
    for (const depElement of dep) {
        if (depElement.scheduler) {
            depElement.scheduler()
        } else {
            depElement.run()
        }
    }
}