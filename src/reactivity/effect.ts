import {extend} from '../shard'
let activeEffect
class ReactiveEffect {
    private _fn: any;
    active = true
    deps = []
    public scheduler: Function | undefined
    onStop?: () => void;
    constructor(fn, scheduler?:Function) {
        this._fn = fn
        this.scheduler = scheduler
    }

    run() {
        activeEffect = this
        const r=this._fn()
        return r
    }

    stop() {
        cleanupEffect(this)
    }
}
function cleanupEffect(effect){
    if(effect.active){
        effect.deps.forEach((dep: any) => {
            dep.delete(effect)
        })
        if(effect.onStop){
            effect.onStop()
        }
        effect.active = false
    }
}
export function effect(fn, options: any = {}) {
    const _effect = new ReactiveEffect(fn)
    extend(_effect,options)
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
    if (activeEffect&&activeEffect.active) {
        dep.add(activeEffect)
        activeEffect.deps.push(dep)
    }
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