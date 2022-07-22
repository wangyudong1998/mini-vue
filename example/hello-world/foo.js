import {h} from "../../lib/mini-vue.esm.js";

export const foo = {
    setup(props,{emit}) {
        const onClick=()=>{
            emit('button-click','value1','value2')
        }
        return {
            onClick
        }
    },
    render() {
        return h('button', {'onClick':this.onClick}, this.text)
    }
}