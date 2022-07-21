export function createVNode(type, props?, child?) {
    return {
        type,
        props,
        child,
        el:null
    }
}