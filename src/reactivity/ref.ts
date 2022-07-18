import {isTracking, trackEffect, triggerEffect} from "./effect";
import {hasChanged, isObject} from "../shard";
import {reactive} from "./reactive";

class RefImpl {
    private _value: any;
    private _rawValue: any;
    dep = new Set()
    constructor(value) {
        this._rawValue=value
        this._value = convert(value)
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
