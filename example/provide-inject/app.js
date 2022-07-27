import {h, provide, inject, createTextVNode} from "../../lib/mini-vue.esm.js"

export const App = {
    setup() {
        provide('bar','barValue')
        provide('baz','bazValue')
    },
    render() {
        return h(
            'div',
            null,
            [h('div', null, 'Provider'),h(middle)]
        )
    },
}

const middle={
    setup() {
        provide('bar','middleBar')
        const bar = inject('bar')
        return {
            bar
        }
    },
    render() {
        return h(
            'div',
            null,
            [h('div', null, 'Middle:'+this.bar),h(foo)]
        )
    },
}
const foo={
    setup() {
        const baz = inject('baz')
        const bar = inject('bar')
        return {
            baz,
            bar
        }
    },
    render(){
        return h('div',null,[createTextVNode('foo:'+this.baz+'-'+this.bar),h(bbb)])
    }
}
const bbb={
    setup() {
        const baz = inject('baz')
        return {
            baz,
        }
    },
    render(){
        return h('div',null,'bbb:'+this.baz)
    }
}