import {camelize, capitalize} from "../shard/index";

export function emit(props,event,...arg){
    const handler=props[`on${capitalize(camelize(event))}`]
    console.log(`on${capitalize(camelize(event))}`)
    handler&&handler(...arg)
}