import {h} from "../../lib/mini-vue.esm.js"

export const App = {
    render() {
        return h(
            'div',
            {id: 'root'},
            [
                h('h1', null, 'child1'),
                h('div', {class: 'child2'}, 'child2')
            ]
        )
    },
    setup() {
        return {
            msg: 'mini-vue'
        }
    }
}