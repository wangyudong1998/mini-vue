import {ReactiveEffect} from "./effect";

class ComputedImpl {
    private _getter: any;
    private _dirty = true;
    private _value: any
    private _effect: any;

    constructor(getter) {
        this._effect = new ReactiveEffect(getter, () => {
            // 在 scheduler 中把锁打开
            this._dirty = true
        })
        this._getter = getter
    }

    get value() {
        if (this._dirty) {
            this._value = this._effect.run()
            this._dirty = false
        }
        return this._value
    }

}

export function

computed(getter) {
    return new ComputedImpl(getter)
}