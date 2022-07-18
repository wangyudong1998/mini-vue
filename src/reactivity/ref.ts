import {isTracking, trackEffect, triggerEffect} from "./effect";
import {hasChanged, isObject} from "../shard";
import {reactive} from "./reactive";
const enum RefFlags {
    IS_REF = '__v_isRef',
}
class RefImpl {
    private _value: any;
    private _rawValue: any;
    public dep = new Set()
    constructor(value) {
        this._rawValue=value
        this._value = convert(value)
        this[RefFlags.IS_REF] = true
    }
    get value() {
        if (isTracking()) {
            trackEffect(this.dep)
        }
        return this._value

    }
    set value(newValue) {
        if (hasChanged(this._rawValue,newValue)) {
            this._rawValue=newValue
            this._value = convert(newValue)
            triggerEffect(this.dep)
        }
    }
}
function convert(value){
    // value值为对象时转成reactive对象
    return isObject(value)?reactive(value):value
}
export function ref(value) {
    return new RefImpl(value)
}
export function isRef(ref){
    return !!ref['__v_isRef']
}
export function unRef(ref){
    return isRef(ref)?ref.value:ref
}
export function proxyRefs(objectWithRef){
    return new Proxy(objectWithRef,{
        get(target,key,receiver){
            return unRef(Reflect.get(target,key,receiver))
        },
        set(target,key,value,receiver){
            // set 分为两种情况，如果原来的值是 ref，并且新的值不是 ref
            // 那么就去更新原来的 ref.value = newValue
            // 第二种情况就是原来的值是 ref，newValue 也是一个 ref
            // 那么就直接替换就 OK 了
            if(isRef(target[key])&&!isRef(value)){
                return target[key].value=value
            }else{
                return Reflect.set(target,key,value,receiver)
            }
        }
    })
}
