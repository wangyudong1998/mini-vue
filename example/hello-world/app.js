import {h} from "../../lib/mini-vue.esm.js"
import {foo} from "./foo.js";

export const App = {
    render() {
        window.self = this
        return h(
            'div',
            {
                id: 'root',
                onClick: () => {
                    console.log('click')
                }
            },
            [
                h('h1', {class: ['child2']}, this.msg),
                h(foo,{count:1})
            ]
        )
    },
    setup() {
        return {
            msg: 'mini-vue'
        }
    }
}