import {h,getCurrentInstance} from "../../lib/mini-vue.esm.js"
import {Foo} from "./foo.js"
export const App = {
    name:'App',
    render() {
        const app=h('div',{},'currentInstance Demo')
        return h('div', null,[app,h(Foo)])
    },
    setup() {
        const instance = getCurrentInstance();
        console.log('appInstance:',instance)
    }
}