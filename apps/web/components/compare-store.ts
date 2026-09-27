"use client";
import {create} from "zustand";
type Item={id:string;title:string;price?:string;image?:string};
type State={items:Item[];toggle:(item:Item)=>void;remove:(id:string)=>void;clear:()=>void};
export const useCompareStore=create<State>((set)=>({items:[],toggle:(item)=>set(s=>s.items.some(x=>x.id===item.id)?{items:s.items.filter(x=>x.id!==item.id)}:{items:s.items.length>=4?s.items:[...s.items,item]}),remove:id=>set(s=>({items:s.items.filter(x=>x.id!==id)})),clear:()=>set({items:[]})}));