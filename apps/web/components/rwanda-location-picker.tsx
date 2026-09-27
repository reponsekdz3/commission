"use client";
import { useEffect, useState } from "react";
import { api } from "../lib/api";

type Item={id:string;name:string;code:string;parentId?:string};
type Values={provinceId:string;districtId:string;sectorId:string;cellId:string;villageId:string;province:string;district:string;sector:string;cell:string;village:string};
export function RwandaLocationPicker({value,onChange}:{value:Values;onChange:(v:Values)=>void}){
  const [options,setOptions]=useState<Record<string,Item[]>>({PROVINCE:[],DISTRICT:[],SECTOR:[],CELL:[],VILLAGE:[]});
  const [error,setError]=useState("");
  useEffect(()=>{void load("PROVINCE");},[]);
  useEffect(()=>{if(value.provinceId)void load("DISTRICT",value.provinceId);},[value.provinceId]);
  useEffect(()=>{if(value.districtId)void load("SECTOR",value.districtId);},[value.districtId]);
  useEffect(()=>{if(value.sectorId)void load("CELL",value.sectorId);},[value.sectorId]);
  useEffect(()=>{if(value.cellId)void load("VILLAGE",value.cellId);},[value.cellId]);
  async function load(level:string,parentId?:string){try{setError("");const q=parentId?`/locations/rwanda?level=${level}&parentId=${parentId}`:`/locations/rwanda?level=${level}`;const rows=await api<Item[]>(q,{method:"GET"});setOptions(x=>({...x,[level]:rows}));}catch(e:any){setError(e.message||"Unable to load Rwanda locations");}}
  function choose(level:keyof Values,id:string){
    const map:any={PROVINCE:"province",DISTRICT:"district",SECTOR:"sector",CELL:"cell",VILLAGE:"village"};
    const item=options[level].find(x=>x.id===id);
    const next:any={...value,[level.toLowerCase()+"Id"]:id,[map[level]]:item?.name??""};
    const reset:any={PROVINCE:["districtId","district","sectorId","sector","cellId","cell","villageId","village"],DISTRICT:["sectorId","sector","cellId","cell","villageId","village"],SECTOR:["cellId","cell","villageId","village"],CELL:["villageId","village"]};
    for(const k of reset[level]||[])next[k]="";
    onChange(next);
  }
  const field=(level:keyof typeof options,label:string,disabled=false)=> <select className="field" value={(value as any)[level.toLowerCase()+"Id"]||""} onChange={e=>choose(level as any,e.target.value)} disabled={disabled||!options[level].length} required><option value="">Select {label}</option>{options[level].map(x=><option key={x.id} value={x.id}>{x.name}</option>)}</select>;
  return <div className="formGrid"><div className="eyebrow">Rwanda administrative location</div><div className="three">{field("PROVINCE","Province")}{field("DISTRICT","District",!value.provinceId)}{field("SECTOR","Sector",!value.districtId)}</div><div className="two">{field("CELL","Cell",!value.sectorId)}{field("VILLAGE","Village",!value.cellId)}</div>{error&&<small className="muted">{error}</small>}<small className="muted">Selections are canonical Rwanda administrative records; each level is restricted to its selected parent.</small></div>;
}
