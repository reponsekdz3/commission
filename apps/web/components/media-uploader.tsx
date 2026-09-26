"use client";

import {useRef,useState} from "react";
import {authApi} from "../lib/api";

export function PropertyMediaUploader({propertyId,onComplete}:{propertyId:string;onComplete?:(media:any[])=>void}) {
 const normalInput=useRef<HTMLInputElement>(null);const tourInput=useRef<HTMLInputElement>(null);const[busy,setBusy]=useState(false);const[message,setMessage]=useState("");
 async function upload(files:FileList|null,forcedKind?:"PHOTO"|"VIDEO"|"TOUR_360"){
  if(!files?.length)return;setBusy(true);setMessage("");
  try{for(const file of Array.from(files)){
   const kind=forcedKind??(file.type.startsWith("video/")?"VIDEO":"PHOTO");
   const signed=await authApi<any>("/media/signed-url",{method:"POST",body:JSON.stringify({propertyId,filename:file.name,contentType:file.type,kind})});
   const put=await fetch(signed.uploadUrl,{method:"PUT",headers:signed.headers||{"Content-Type":file.type},body:file});
   if(!put.ok)throw new Error(`Upload failed for ${file.name} (${put.status})`);
   const media=await authApi<any[]>("/media/complete",{method:"POST",body:JSON.stringify({propertyId,key:signed.key,kind})});
   onComplete?.(media);setMessage(`${file.name} uploaded. Processing is queued by the backend.`);
  }}catch(e:any){setMessage(e.message||"Upload failed")}finally{setBusy(false)}
 }
 return <div className="panel" style={{marginTop:18}}>
  <div className="eyebrow">Media pipeline</div><h3>Photos, video & 360° tours</h3>
  <p className="muted">Files upload directly to configured object storage. The API records each asset and queues processing; no demo media is generated.</p>
  <input ref={normalInput} type="file" multiple accept="image/jpeg,image/png,image/webp,video/mp4" hidden onChange={e=>void upload(e.target.files)}/>
  <input ref={tourInput} type="file" multiple accept="image/jpeg,image/png,image/webp" hidden onChange={e=>void upload(e.target.files,"TOUR_360")}/>
  <div className="actions"><button className="btn" disabled={busy} onClick={()=>normalInput.current?.click()}>{busy?"Uploading…":"Upload photos/video →"}</button><button className="btn ghost" disabled={busy} onClick={()=>tourInput.current?.click()}>Upload 360 panorama →</button></div>
  {message&&<p className="muted" role="status">{message}</p>}
 </div>;
}
