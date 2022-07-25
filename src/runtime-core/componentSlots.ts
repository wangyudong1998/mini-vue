import {isArray} from "../shard/index";

export function initSlots(instance,children){
    if(!children) return
    //只传了一个h
    if(children.vnode){
        // 默认插槽
        instance.slots.default=[children]
        return;
    }
    //传了一个数组
    if(isArray(children)){
        // 默认插槽
        instance.slots.default=children
        return;
    }
    // 对象
    for (const slotKey in children) {
        // 具名插槽
        // instance.slots[slotKey]=normalizeSlotValue(children[slotKey])

        //作用域插槽
        instance.slots[slotKey]=(props)=>normalizeSlotValue(children[slotKey](props))
    }
}
function normalizeSlotValue(value){
    return isArray(value)?value:[value]
}