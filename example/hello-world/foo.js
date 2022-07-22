import {h} from "../../lib/mini-vue.esm.js";

export const foo={
    render(){
        return h('div',{},'foo:'+this.count)
    },
    setup(props){
        console.log(props)
        props.count=10
    }

}