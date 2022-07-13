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

    it("scheduler", () => {
        let dummy;
        let run: any;
        const scheduler = jest.fn(() => {
            run = runner;
        });
        const obj = reactive({foo: 1});
        const runner = effect(
            () => {
                dummy = obj.foo;
            },
            {scheduler}
        );
        expect(scheduler).not.toHaveBeenCalled();
        expect(dummy).toBe(1);
        // should be called on first trigger
        obj.foo++;
        expect(scheduler).toHaveBeenCalledTimes(1);
        // // should not run yet
        expect(dummy).toBe(1);
        // // manually run
        run();
        // // should have run
        expect(dummy).toBe(2);
    });


})