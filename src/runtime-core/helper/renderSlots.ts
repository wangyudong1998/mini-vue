import {h} from "../h";
import {Fragment} from "../vnode";

export function renderSlots(slots, name = 'default',prop) {
    const slot = slots[name]
    if (slot) {
        return h(Fragment, null, slot(prop))
    }
}