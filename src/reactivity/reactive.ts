import {mutableHandlers, readonlyHandlers, shallowReadonlyHandlers} from './baseHandlers'
export const enum ReactiveFlags{
    IS_REACTIVE='__v_isReactive',
    IS_READONLY='__v_isReadonly'
}
function createActiveObject(raw, baseHandlers) {
    return new Proxy(raw, baseHandlers)
}

export function reactive(raw) {
    return createActiveObject(raw, mutableHandlers)
}

export function readonly(raw) {
    return createActiveObject(raw, readonlyHandlers)
}
export function shallowReadonly(raw) {
    return createActiveObject(raw, shallowReadonlyHandlers)
}
export function isReactive(val){
    return !!val[ReactiveFlags.IS_REACTIVE]
}
export function isReadonly(val){
    return !!val[ReactiveFlags.IS_READONLY]
}
export function isProxy(val){
    return isReactive(val)||isReadonly(val)
}