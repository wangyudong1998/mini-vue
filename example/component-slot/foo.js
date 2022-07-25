import {h, renderSlots} from "../../lib/mini-vue.esm.js";

export const Foo = {
    setup() {

    },
    render() {
        const foo = h('div', null, 'foo')
        return h(
            'div',
            null, [
                renderSlots(this.$slots,'header',{title:'head'}),
                foo,
                renderSlots(this.$slots,'footer')
            ])
    }
}