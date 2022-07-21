import {h} from "../../lib/mini-vue.esm.js"

export const App = {
    render() {
        window.self=this
        return h(
            'div',
            {id: 'root'},
            [
                h('h1', null, this.msg),
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