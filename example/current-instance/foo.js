import {h,getCurrentInstance} from "../../lib/mini-vue.esm.js";

export const Foo = {
    name:'Foo',
    setup() {
        const instance=getCurrentInstance()
        console.log('fooInstance:',instance)
    },
    render() {
        return h('div', null, '')
    }
}