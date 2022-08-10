export const Fragment=Symbol('Fragment')
export const Text=Symbol('Text')
export function createVNode(type, props?, children?) {
    return {
        type,
        props,
        children,
        key:props&&props.key,
        el:null,
        //初始化 component,指向该vnode所在的组件实例
        component:null,
    }
}
export function createTextVNode(text){
    return createVNode(Text,{},text)
}