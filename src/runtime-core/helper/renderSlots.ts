import {h} from "../h";
import {Fragment} from "../vnode";

export function renderSlots(slots, name = 'default', prop) {
    const slot = slots[name]
    if (slot) {
        if (name === 'default') {
            return h(Fragment, null, slot)
        } else {
            return h(Fragment, null, slot(prop))
        }
    }
}