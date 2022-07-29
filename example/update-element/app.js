import {h,ref} from "../../lib/mini-vue.esm.js"


export const App = {
    render() {
        return h('div',null,[
            h('div',null,'count:'+this.count),
            h('button',{onClick:this.click},'increment')
        ])
    },
    setup() {
        const count = ref(0);
        function click(){
            count.value++
        }
        return {
            count,
            click
        }
    }
}