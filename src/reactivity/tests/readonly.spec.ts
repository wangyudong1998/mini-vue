import {isReactive, isReadonly, readonly, shallowReadonly} from "../reactive";
import {effect} from "../effect";

describe('readonly', () => {
    it('happy path', () => {
        // not set
        const original = {foo: 1, bar: 2}
        const wrapped = readonly(original)
        expect(wrapped).not.toBe(original)
        expect(wrapped.bar).toBe(2)
        wrapped.foo = 2
        // set 后不会更改
        expect(wrapped.foo).toBe(1)
        expect(isReadonly(wrapped)).toBe(true)
        expect(isReadonly(original)).toBe(false)
    })
    it('should warn when update readonly prop value', () => {
        // 这里使用 jest.fn
        console.warn = jest.fn()
        const readonlyObj = readonly({foo: 1})
        readonlyObj.foo = 2
        expect(console.warn).toHaveBeenCalled()
    })
    it('should readonly nested object', () => {
        const nested = {foo: {innerFoo: 1}, bar: [{innerBar: 2}]}
        const wrapped = readonly(nested)
        expect(isReadonly(wrapped.foo)).toBe(true)
        expect(isReadonly(wrapped.bar)).toBe(true)
        expect(isReadonly(wrapped.bar[0])).toBe(true)
    })
    it('shallowReadonly', () => {
        const original = {
            name: 'original',
            nested: {foo: 'foo'}
        }
        const observed = shallowReadonly(original)
        expect(isReadonly(observed)).toBe(true)
        expect(isReadonly(observed.nested)).toBe(false)
    })
    it('should warn when update shallowReadonly prop value', () => {
        console.warn = jest.fn()
        const original = {
            name: 'original',
            nested: {foo: 'foo'}
        }
        const observed = shallowReadonly(original)
        observed.name = 'observed'
        expect(console.warn).toHaveBeenCalled()
    })
})