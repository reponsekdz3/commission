import * as DocumentPicker from "expo-document-picker";
import * as Linking from "expo-linking";
import { useEffect, useRef, useState } from "react";
import { FlatList, SafeAreaView, StyleSheet, Text, View } from "react-native";
import { io, Socket } from "socket.io-client";
import { api, API, token } from "../src/lib/api";
import { Bubble, Composer, TypingIndicator } from "../src/components/chat";
import { useTheme } from "../src/stores/theme";
import { fonts, spacing } from "../src/theme";
import { selection } from "../src/lib/haptics";import { ChatRowSkeleton } from "../src/components/ui";

type Conversation={id:string;memberIds:string[];propertyId?:string;bookingId?:string;createdAt:string};
type Attachment={id:string;filename:string;contentType:string;sizeBytes:number};

export default function Messages(){
 const c=useTheme(s=>s.palette);
 const[items,setItems]=useState<Conversation[]>([]),[active,setActive]=useState<any>(),[error,setError]=useState(""),[uploading,setUploading]=useState(false),[typing,setTyping]=useState(false);
 const socket=useRef<Socket|null>(null);
 async function load(){try{setItems(await api<Conversation[]>("/messages/conversations",{},true))}catch(e){setError(e instanceof Error?e.message:"Unable to load messages")}}
 useEffect(()=>{void load();let alive=true;(async()=>{const t=await token();if(!t||!alive)return;const base=API.replace(/\/api\/v1$/,"");const s=io(base+"/realtime",{auth:{token:t},transports:["websocket"]});socket.current=s;s.on("message:new",(m:any)=>{setActive((v:any)=>v?({...v,messages:[...(v.messages||[]),m]}):v);void load()});s.on("typing",(m:any)=>setTyping(Boolean(m.active)));s.on("connect_error",()=>setError("Realtime connection unavailable; REST messaging remains active."));})();return()=>{alive=false;socket.current?.disconnect();socket.current=null}},[]);
 useEffect(()=>{if(active?.id)socket.current?.emit("join:conversation",{conversationId:active.id})},[active?.id]);
 async function open(id:string){try{const x=await api<any>("/messages/conversations/"+id,{},true);setActive(x);await api("/messages/"+id+"/read",{method:"POST"},true)}catch(e){setError(e instanceof Error?e.message:"Unable to open conversation")}}
 async function upload(){if(!active||uploading)return;setUploading(true);try{const result=await DocumentPicker.getDocumentAsync({multiple:true,copyToCacheDirectory:true,type:"*/*"});if(result.canceled)return;const uploaded:Attachment[]=[];for(const asset of result.assets){const blob=await(await fetch(asset.uri)).blob();if(blob.size>50*1024*1024)throw new Error("Attachment exceeds 50 MB");const signed=await api<any>("/messages/attachments/signed-url",{method:"POST",body:JSON.stringify({conversationId:active.id,filename:asset.name,contentType:asset.mimeType||blob.type,sizeBytes:blob.size})},true);const put=await fetch(signed.uploadUrl,{method:"PUT",headers:signed.headers||{"Content-Type":asset.mimeType||blob.type},body:blob});if(!put.ok)throw new Error("Upload failed");uploaded.push(await api<Attachment>("/messages/attachments/complete",{method:"POST",body:JSON.stringify({conversationId:active.id,key:signed.key,filename:asset.name,contentType:asset.mimeType||blob.type})},true));}socket.current?.emit("message:send",{conversationId:active.id,body:"Attachment",attachmentIds:uploaded.map(x=>x.id)});await open(active.id)}catch(e){setError(e instanceof Error?e.message:"Unable to upload attachment")}finally{setUploading(false)}}
 function send(body:string){if(!active)return;selection();socket.current?.emit("message:send",{conversationId:active.id,body});}
 function sendTyping(activeNow:boolean){socket.current?.emit("typing",{conversationId:active?.id,active:activeNow})}
 async function openAttachment(id:string){try{const r=await api<any>("/messages/attachments/"+id+"/download",{},true);if(r.downloadUrl)await Linking.openURL(r.downloadUrl)}catch(e){setError(e instanceof Error?e.message:"Unable to open attachment")}}
 return <SafeAreaView style={[s.safe,{backgroundColor:c.bg}]}><View style={s.wrap}><Text style={[s.title,{color:c.text,fontFamily:fonts.displayStrong}]}>Messages</Text>{!!error&&<Text style={[s.error,{color:c.danger}]}>{error}</Text>}
 <FlatList style={s.list} data={items} refreshing={false} onRefresh={()=>void load()} keyExtractor={x=>x.id} ListEmptyComponent={<Text style={{color:c.muted,textAlign:"center",padding:30}}>No conversations yet. Start a conversation from a property listing.</Text>} renderItem={({item})=><View style={[s.item,{backgroundColor:c.surface,borderColor:c.border}]}><Text onPress={()=>void open(item.id)} style={[s.itemTitle,{color:c.text}]}>{active?.id===item.id?"● ":""}Conversation</Text><Text style={{color:c.muted}}>{item.propertyId?"Property "+item.propertyId:"General inquiry"}</Text></View>}/>
 {active&&<View style={[s.thread,{backgroundColor:c.surface,borderColor:c.border}]}><Text style={[s.threadTitle,{color:c.text}]}>Conversation</Text><FlatList data={active.messages||[]} keyExtractor={(x:any)=>x.id} style={s.history} renderItem={({item}:any)=><View><Bubble text={item.body} mine={Boolean(item.senderId&&item.senderId===active.currentUserId)} timestamp={new Date(item.createdAt).toLocaleTimeString()} read={Boolean(item.readAt)} onLongPress={()=>{}} />{(item.attachments||[]).map((a:any)=><Text key={a.id} onPress={()=>void openAttachment(a.id)} style={{color:c.primary,fontWeight:"800"}}>↗ {a.filename}</Text>)}</View>}/>{typing&&<TypingIndicator/>}<Composer onSend={send} onAttach={()=>void upload()} onCamera={()=>void upload()}/></View>}
 </View></SafeAreaView>;
}
const s=StyleSheet.create({safe:{flex:1},wrap:{padding:spacing.lg,flex:1},title:{fontSize:32,marginBottom:12},list:{flex:1},item:{padding:14,borderRadius:16,marginBottom:8,borderWidth:1},itemTitle:{fontWeight:"900",fontSize:16},error:{marginBottom:8},thread:{borderRadius:16,borderWidth:1,padding:12,marginTop:8,height:460},threadTitle:{fontWeight:"900",fontSize:17},history:{marginTop:8,flex:1}});