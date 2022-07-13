let activeEffect
class ReactiveEffect{
    private _fn: any;
    constructor(fn){
        this._fn=fn
    }
    run(){
        activeEffect=this
        return this._fn()
    }
}
export function effect(fn){
    let _effect=new ReactiveEffect(fn)
    _effect.run()
    return _effect.run.bind(_effect)

}
const targetMap=new WeakMap()
export function track(target,key){
    let depsMap=targetMap.get(target)
    if(!depsMap){
        depsMap=new Map()
        targetMap.set(target,depsMap)
    }
    let dep=depsMap.get(key)
    if(!dep){
        dep=new Set()
        depsMap.set(key,dep)
    }
    dep.add(activeEffect)
}
export function trigger(target,key){
    let depsMap=targetMap.get(target)
    let dep=depsMap.get(key)
    for (const depElement of dep) {
        depElement.run()
    }
}