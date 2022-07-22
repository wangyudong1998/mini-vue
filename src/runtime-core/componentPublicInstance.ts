import {hasOwn} from "../shard/index";

const publicPropertiesMap = {
    '$el': (i) => i.vnode.el
}
export const publicInstanceProxyHandlers = {
    get({_: instance}, key) {
        const {setupState, props} = instance
        if (hasOwn(setupState, key)) {
            if (key in setupState) {
                return setupState[key]
            }
        } else if (hasOwn(props,key)){
            if (key in props) {
                return props[key]
            }
        }
            const publicGetter = publicPropertiesMap[key]
        if (publicGetter) {
            return publicGetter(instance)
        }
    },
}