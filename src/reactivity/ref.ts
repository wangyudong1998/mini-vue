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
