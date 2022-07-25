import {h} from "../h";

export function renderSlots(slots, name = 'default',prop) {
    const slot = slots[name]
    if (slot) {
        return h('div', null, slot(prop))
    }
}