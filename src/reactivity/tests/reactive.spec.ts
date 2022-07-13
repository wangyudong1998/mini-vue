import {reactive,readonly} from "../reactive";

describe('reactive',()=>{
    it('happy path', ()=>{
        const original={foo:1}
        const observed=reactive(original)
        expect(observed).not.toBe(original)
        expect(observed.foo).toBe(1)
    });
})
describe('readonly',()=>{
    it('happy path', () => {
        // not set
        const original = { foo: 1, bar: 2 }
        const wrapped = readonly(original)
        expect(wrapped).not.toBe(original)
        expect(wrapped.bar).toBe(2)
        wrapped.foo = 2
        // set 后不会更改
        expect(wrapped.foo).toBe(1)
    })
    it('should warn when update readonly prop value', () => {
        // 这里使用 jest.fn
        console.warn = jest.fn()
        const readonlyObj = readonly({ foo: 1 })
        readonlyObj.foo = 2
        expect(console.warn).toHaveBeenCalled()
    })
})