import {h,ref} from "../../lib/mini-vue.esm.js"


export const App = {
    render() {
        return h('div',{foo:this.props.foo,bar:this.props.bar},[
            h('div',null,'count:'+this.count),
            h('button',{onClick:this.click},'increment'),
            h('button',{onClick:this.patchProp1},'修改foo的值'),
            h('button',{onClick:this.patchProp2},'把bar变成undefined'),
            h('button',{onClick:this.patchProp3},'移除foo'),
        ])
    },
    setup() {
        const count = ref(0);
        function click(){
            count.value++
        }

        const props = ref({
            foo: 'foo',
            bar: 'bar',
        })
        function patchProp1() {
            // 逻辑1: old !== new
            props.value.foo = 'new-foo'
        }
        function patchProp2() {
            // 逻辑2: new === undefined || null, remove new
            props.value.bar = undefined
        }
        function patchProp3() {
            // 逻辑3: old 存在，new 不存在，remove new
            props.value = {
                bar: 'bar',
            }
        }
        return{
            props,
            patchProp1,
            patchProp2,
            patchProp3,
            click,
            count,
        }
    }
}