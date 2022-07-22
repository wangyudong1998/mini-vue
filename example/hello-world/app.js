import {h} from "../../lib/mini-vue.esm.js"
import {foo} from "./foo.js";

export const App = {
    render() {
        window.self = this
        return h(
            'div',
            {
                id: 'root',
            },
            [
                h('h1', {
                    class: ['child2'],
                    onClick: () => {
                        console.log(`click---${this.msg}`)
                    }
                }, this.msg),
                h(foo, {text: 'Add',onButtonClick:this.click})
            ]
        )
    },
    setup() {
        const click=(...arg)=>{
            console.log('button-click',arg)
        }
        return {
            msg: 'mini-vue',
            click
        }
    }
}