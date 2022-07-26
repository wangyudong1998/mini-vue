export const Fragment=Symbol('Fragment')
export const Text=Symbol('Text')
export function createVNode(type, props?, children?) {
    return {
        type,
        props,
        children,
        el:null
    }
}
export function createTextVNode(text){
    return createVNode(Text,{},text)
}