"use client";

import {useEffect,useRef,useState} from "react";

type Scene={id:string;url:string;label?:string};

const vertex=`attribute vec3 aPosition;
attribute vec2 aUv;
uniform mat4 uMvp;
varying vec2 vUv;
void main(){vUv=aUv;gl_Position=uMvp*vec4(aPosition,1.0);}`;

const fragment=`precision mediump float;
uniform sampler2D uTexture;
varying vec2 vUv;
void main(){gl_FragColor=texture2D(uTexture,vUv);}`;

function perspective(fov:number,aspect:number,near:number,far:number){
 const f=1/Math.tan(fov/2),nf=1/(near-far);
 return new Float32Array([f/aspect,0,0,0,0,f,0,0,0,0,(far+near)*nf,-1,0,0,(2*far*near)*nf,0]);
}
function multiply(a:Float32Array,b:Float32Array){
 const o=new Float32Array(16);
 for(let c=0;c<4;c++)for(let r=0;r<4;r++)o[c*4+r]=a[r]*b[c*4]+a[4+r]*b[c*4+1]+a[8+r]*b[c*4+2]+a[12+r]*b[c*4+3];
 return o;
}
function rotation(yaw:number,pitch:number){
 const y=yaw*Math.PI/180,p=pitch*Math.PI/180,cy=Math.cos(y),sy=Math.sin(y),cp=Math.cos(p),sp=Math.sin(p);
 return new Float32Array([
   cy,sy*sp,-sy*cp,0,
   0,cp,sp,0,
   sy,-cy*sp,cy*cp,0,
   0,0,0,1
 ]);
}
function sphere(){
 const v:number[]=[],i:number[]=[];const lat=32,lon=64;
 for(let y=0;y<=lat;y++){const p=y*Math.PI/lat;for(let x=0;x<=lon;x++){const t=x*2*Math.PI/lon;v.push(Math.sin(p)*Math.cos(t),Math.cos(p),Math.sin(p)*Math.sin(t),x/lon,1-y/lat);}}
 for(let y=0;y<lat;y++)for(let x=0;x<lon;x++){const a=y*(lon+1)+x,b=a+lon+1;i.push(a,b,a+1,b,b+1,a+1);}
 return {v:new Float32Array(v),i:new Uint16Array(i)};
}

export function ImmersiveTour({media=[]}:{media?:Scene[]}) {
 const scenes=media.filter(x=>x?.url);const canvas=useRef<HTMLCanvasElement>(null);const wrap=useRef<HTMLDivElement>(null);
 const [index,setIndex]=useState(0);const [status,setStatus]=useState("Loading 360° scene…");const drag=useRef<{x:number;y:number}|null>(null);const view=useRef({yaw:0,pitch:0,fov:75});
 const scene=scenes[index];

 useEffect(()=>{
   const el=canvas.current;if(!el||!scene)return;
   const gl=el.getContext("webgl",{antialias:true});if(!gl){setStatus("WebGL is not available on this device.");return;}
   const compile=(type:number,src:string)=>{const s=gl.createShader(type)!;gl.shaderSource(s,src);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw new Error(gl.getShaderInfoLog(s)||"Shader compile failed");return s};
   const program=gl.createProgram()!;gl.attachShader(program,compile(gl.VERTEX_SHADER,vertex));gl.attachShader(program,compile(gl.FRAGMENT_SHADER,fragment));gl.linkProgram(program);
   if(!gl.getProgramParameter(program,gl.LINK_STATUS)){setStatus("Unable to initialize the panorama renderer.");return;}
   const mesh=sphere(),vb=gl.createBuffer()!,ib=gl.createBuffer()!;
   gl.bindBuffer(gl.ARRAY_BUFFER,vb);gl.bufferData(gl.ARRAY_BUFFER,mesh.v,gl.STATIC_DRAW);
   gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,ib);gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,mesh.i,gl.STATIC_DRAW);
   const stride=5*4,pos=gl.getAttribLocation(program,"aPosition"),uv=gl.getAttribLocation(program,"aUv");
   gl.enableVertexAttribArray(pos);gl.vertexAttribPointer(pos,3,gl.FLOAT,false,stride,0);gl.enableVertexAttribArray(uv);gl.vertexAttribPointer(uv,2,gl.FLOAT,false,stride,12);
   const texture=gl.createTexture()!;gl.bindTexture(gl.TEXTURE_2D,texture);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
   const img=new Image();img.crossOrigin="anonymous";img.onload=()=>{gl.bindTexture(gl.TEXTURE_2D,texture);gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,1);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,img);setStatus("Drag to look around · scroll or buttons to zoom");draw();};img.onerror=()=>setStatus("Panorama could not be loaded. Check object-storage CORS/CDN settings.");img.src=scene.url;
   const mvpLoc=gl.getUniformLocation(program,"uMvp");const texLoc=gl.getUniformLocation(program,"uTexture");
   const resize=()=>{const d=window.devicePixelRatio||1,w=Math.max(1,el.clientWidth*d),h=Math.max(1,el.clientHeight*d);if(el.width!==w||el.height!==h){el.width=w;el.height=h;gl.viewport(0,0,w,h)}};
   const draw=()=>{resize();gl.clearColor(.03,.03,.03,1);gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);gl.useProgram(program);gl.bindBuffer(gl.ARRAY_BUFFER,vb);gl.enableVertexAttribArray(pos);gl.vertexAttribPointer(pos,3,gl.FLOAT,false,stride,0);gl.enableVertexAttribArray(uv);gl.vertexAttribPointer(uv,2,gl.FLOAT,false,stride,12);const projection=perspective(view.current.fov*Math.PI/180,el.width/el.height,.01,100);gl.uniformMatrix4fv(mvpLoc,false,multiply(projection,rotation(view.current.yaw,view.current.pitch)));gl.activeTexture(gl.TEXTURE0);gl.bindTexture(gl.TEXTURE_2D,texture);gl.uniform1i(texLoc,0);gl.drawElements(gl.TRIANGLES,mesh.i.length,gl.UNSIGNED_SHORT,0);};
   const onResize=()=>draw();window.addEventListener("resize",onResize);gl.disable(gl.CULL_FACE);gl.enable(gl.DEPTH_TEST);setStatus("Loading 360° scene…");
   return()=>{window.removeEventListener("resize",onResize);img.src="";gl.deleteTexture(texture);gl.deleteBuffer(vb);gl.deleteBuffer(ib);gl.deleteProgram(program)};
 },[scene?.url]);

 if(!scene)return null;
 const move=(x:number,y:number)=>{const d=drag.current;if(!d)return;view.current.yaw+=(x-d.x)*.18;view.current.pitch=Math.max(-85,Math.min(85,view.current.pitch+(y-d.y)*.12));drag.current={x,y};canvas.current?.dispatchEvent(new Event("viewchange"));};
 return <section className="tourPanel" aria-label="True 360 degree property tour">
   <div ref={wrap} className="tourViewport">
     <canvas ref={canvas} onPointerDown={e=>{e.currentTarget.setPointerCapture(e.pointerId);drag.current={x:e.clientX,y:e.clientY}}} onPointerMove={e=>move(e.clientX,e.clientY)} onPointerUp={()=>{drag.current=null}} onPointerCancel={()=>{drag.current=null}} onWheel={e=>{e.preventDefault();view.current.fov=Math.max(35,Math.min(95,view.current.fov+e.deltaY*.04));canvas.current?.dispatchEvent(new Event("viewchange"))}} aria-label={scene.label||"360 panorama"}/>
     <div className="tourHud"><span>WebGL 360° panorama</span><span>{status}</span></div>
     <div className="tourControls"><button type="button" className="btn ghost" onClick={()=>{view.current.yaw-=20;canvas.current?.dispatchEvent(new Event("viewchange"))}}>←</button><button type="button" className="btn ghost" onClick={()=>{view.current.yaw+=20;canvas.current?.dispatchEvent(new Event("viewchange"))}}>→</button><button type="button" className="btn ghost" onClick={()=>{view.current.fov=Math.max(35,view.current.fov-8);canvas.current?.dispatchEvent(new Event("viewchange"))}}>＋</button><button type="button" className="btn ghost" onClick={()=>{view.current.fov=Math.min(95,view.current.fov+8);canvas.current?.dispatchEvent(new Event("viewchange"))}}>−</button><button type="button" className="btn ghost" onClick={()=>wrap.current?.requestFullscreen?.()}>⛶</button></div>
   </div>
   <div className="tourScenes">{scenes.map((s,i)=><button key={s.id} type="button" className={i===index?"chip active":"chip"} onClick={()=>{view.current={yaw:0,pitch:0,fov:75};setIndex(i)}}>{s.label||`Room ${i+1}`}</button>)}</div>
 </section>;
}