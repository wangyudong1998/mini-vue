let activeEffect
class ReactiveEffect{
    private _fn: any;
    public scheduler:Function|undefined
    constructor(fn,scheduler?){
        this._fn=fn
        this.scheduler=scheduler
    }
    run(){
        activeEffect=this
        return this._fn()
    }
}
export function effect(fn,options:any={}){
    let _effect=new ReactiveEffect(fn,options.scheduler)
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
        if(depElement.scheduler){
            depElement.scheduler()
        }else{
            depElement.run()
        }
    }
}