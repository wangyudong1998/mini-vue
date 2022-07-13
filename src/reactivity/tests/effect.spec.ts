import {reactive} from "../reactive"
import {effect} from "../effect"

describe("effect", () => {
    it("happy path", () => {
        const user = reactive({
            age: 20
        })
        let nextAge
        effect(() => {
            nextAge = user.age + 1
        })
        expect(nextAge).toBe(21)
        user.age++
        expect(nextAge).toBe(22)
    });

    it("effect should return runner", () => {
        let foo = 10
        let runner = effect(() => {
            foo++
            return 'foo'
        })
        expect(foo).toBe(11)
        let r = runner()
        expect(foo).toBe(12)
        expect(r).toBe('foo')
    });
})