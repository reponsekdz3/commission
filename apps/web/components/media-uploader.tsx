"use client";

import {useRef,useState} from "react";
import {authApi,apiUrl} from "../lib/api";

export function PropertyMediaUploader({propertyId,onComplete}:{propertyId:string;onComplete?:(media:any[])=>void}) {
 const input=useRef<HTMLInputElement>(null); const [busy,setBusy]=useState(false); const [message,setMessage]=useState("");
 async function upload(files:FileList|null,forcedKind?:"PHOTO"|"VIDEO"|"TOUR_360"){
  if(!files?.length)return;
  setBusy(true);setMessage("");
  try{
   for(const file of Array.from(files)){
    const kind=forcedKind??(file.type.startsWith("video/")?"VIDEO":"PHOTO");
    const signed=await authApi<any>("/media/signed-url",{method:"POST",body:JSON.stringify({propertyId,filename:file.name,contentType:file.type,kind})});
    const put=await fetch(signed.uploadUrl,{method:"PUT",headers:signed.headers||{"Content-Type":file.type},body:file});
    if(!put.ok)throw new Error(`Upload failed for ${file.name} (${put.status})`);
    const media=await authApi<any[]>("/media/complete",{method:"POST",body:JSON.stringify({propertyId,key:signed.key,kind})});
    onComplete?.(media); setMessage(`${file.name} uploaded and queued for processing.`);
   }
  }catch(e:any){setMessage(e.message||"Upload failed")}finally{setBusy(false)}
 }
 return <div className="panel" style={{marginTop:18}}>
  <div className="eyebrow">Media pipeline</div><h3>Photos & property video</h3>
  <p className="muted">Uploads go directly to S3-compatible storage; the API records the asset and queues processing. No demo media is created.</p>
  <input ref={input} type="file" multiple accept="image/jpeg,image/png,image/webp,video/mp4" hidden onChange={e=>void upload(e.target.files)}/>
  <div className="actions"><button className="btn" disabled={busy} onClick={()=>input.current?.click()}>{busy?"Uploading…":"Upload photos/video →"}</button><button className="btn ghost" disabled={busy} onClick={()=>{if(input.current){input.current.accept="image/jpeg,image/png,image/webp";input.current.onchange=null;}input.current?.click();}}>Upload 360 panorama →</button></div>
  {message&&<p className="muted" role="status">{message}</p>}
 </div>;
}
