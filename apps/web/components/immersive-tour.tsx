"use client";

import {useMemo,useState} from "react";

type Scene={id:string;url:string;label:string};

export function ImmersiveTour({media=[]}:{media?:Scene[]}) {
  const scenes=useMemo(()=>media.filter(x=>x?.url),[media]);
  const [index,setIndex]=useState(0);
  const [yaw,setYaw]=useState(0);
  const [pitch,setPitch]=useState(0);
  const [zoom,setZoom]=useState(1);
  const [drag,setDrag]=useState<{x:number;y:number}|null>(null);
  const scene=scenes[index];

  if(!scene) return null;
  const onPointerDown=(e:React.PointerEvent<HTMLDivElement>)=>{e.currentTarget.setPointerCapture(e.pointerId);setDrag({x:e.clientX,y:e.clientY});};
  const onPointerMove=(e:React.PointerEvent<HTMLDivElement>)=>{
    if(!drag)return;
    setYaw(v=>v+(e.clientX-drag.x)*0.28);
    setPitch(v=>Math.max(-28,Math.min(28,v+(e.clientY-drag.y)*0.18)));
    setDrag({x:e.clientX,y:e.clientY});
  };
  const transform=`scale(${zoom}) translate3d(${yaw/5}px,${pitch/5}px,0)`;

  return <section className="tourPanel" aria-label="Immersive property tour">
    <div className="tourViewport" onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={()=>setDrag(null)} onPointerCancel={()=>setDrag(null)}>
      <img src={scene.url} alt={scene.label||"360 property view"} draggable={false} style={{transform,transformOrigin:"center",cursor:drag?"grabbing":"grab"}}/>
      <div className="tourHud"><span>360° immersive view</span><span>Drag to look · wheel/controls to zoom</span></div>
      <div className="tourControls">
        <button type="button" className="btn ghost" onClick={()=>setYaw(v=>v-20)}>←</button>
        <button type="button" className="btn ghost" onClick={()=>setYaw(v=>v+20)}>→</button>
        <button type="button" className="btn ghost" onClick={()=>setZoom(v=>Math.min(2,v+.15))}>＋</button>
        <button type="button" className="btn ghost" onClick={()=>setZoom(v=>Math.max(1,v-.15))}>−</button>
      </div>
    </div>
    <div className="tourScenes">{scenes.map((s,i)=><button key={s.id} type="button" className={i===index?"chip active":"chip"} onClick={()=>{setIndex(i);setYaw(0);setPitch(0)}}>{s.label||`Room ${i+1}`}</button>)}</div>
  </section>;
}
