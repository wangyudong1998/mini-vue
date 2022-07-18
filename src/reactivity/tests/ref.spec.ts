import {isRef, ref, unRef} from "../ref";
import {effect} from "../effect";
import {isReactive, reactive} from "../reactive";

it('happy path', () => {
    const refFoo = ref(1)
    expect(refFoo.value).toBe(1)
})
it('ref should be reactive', () => {
    const r = ref(1)
    let dummy
    let calls = 0
    effect(() => {
        calls++
        dummy = r.value
    })
    expect(calls).toBe(1)
    expect(dummy).toBe(1)
    r.value = 2
    expect(calls).toBe(2)
    expect(dummy).toBe(2)
    // 相同的值不会触发依赖
    r.value = 2
    expect(calls).toBe(2)
    expect(dummy).toBe(2)
})
it('should make nested properties reactive', () => {
    let calls=0
    const a = ref({
        foo: 1,
    })
    let dummy
    effect(() => {
        calls++
        dummy = a.value.foo
    })
    a.value.foo = 2
    expect(dummy).toBe(2)
    expect(isReactive(a.value)).toBe(true)
    expect(calls).toBe(2)
})
it('isRef', () => {
    expect(isRef(1)).toBe(false)
    expect(isRef(ref(1))).toBe(true)
    expect(isRef(reactive({ foo: 1 }))).toBe(false)
})
it('unRef', () => {
    const a=ref(1)
    expect(unRef(a)).toBe(1)
    expect(unRef(1)).toBe(1)
})