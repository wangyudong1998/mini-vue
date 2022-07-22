export const extend=Object.assign

export function isObject(val){
    return val!==null&&typeof val==='object'
}
export function isString(val){
    return typeof val==='string'
}
export function isArray(val){
    return Array.isArray(val)
}
export function hasChanged(value,newValue){
    return !Object.is(value,newValue)
}
export function isOn(key){
    return /^on[A-Z]/.test(key)
}
export function hasOwn(obj,key){
    return Object.prototype.hasOwnProperty.call(obj,key)
}
export function capitalize(str:string){
    return str.charAt(0).toUpperCase()+str.slice(1)
}
export function camelize(str:string){
    return str.replace(/-(\w)/g,(_,c)=>{
        return c?c.toUpperCase():''
    })
}