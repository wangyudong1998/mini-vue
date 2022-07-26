import {h,createTextVNode} from "../../lib/mini-vue.esm.js"
import {Foo} from "./foo.js"
export const App = {
    render() {
        const app=h('div',{},'App')

        // 默认插槽
        // const foo=h(Foo,null,[h('p',null,'123'),h('p',null,'456')])

        //具名插槽+作用域插槽
        const foo=h(
            Foo,
            null,
            {
                header:({title})=>h('div',{},'hhhhhh'+title),
                // 文本节点
                footer:()=>createTextVNode('footer')
            }
        )
        return h('div', null,[foo])
    },
    setup() {
    }
}