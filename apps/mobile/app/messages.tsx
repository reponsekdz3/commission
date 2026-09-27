import * as DocumentPicker from "expo-document-picker";
import * as Linking from "expo-linking";
import{useEffect,useState}from"react";
import{FlatList,Pressable,SafeAreaView,StyleSheet,Text,TextInput,View}from"react-native";
import{api}from"../src/lib/api";

type Conversation={id:string;memberIds:string[];propertyId?:string;bookingId?:string;createdAt:string};
type PendingAttachment={id:string;filename:string;contentType:string;sizeBytes:number};
function mime(name:string,fallback?:string){if(fallback)return fallback;const ext=name.toLowerCase().split(".").pop();return ext==="jpg"||ext==="jpeg"?"image/jpeg":ext==="png"?"image/png":ext==="webp"?"image/webp":ext==="gif"?"image/gif":ext==="mp4"?"video/mp4":ext==="webm"?"video/webm":ext==="mp3"?"audio/mpeg":ext==="wav"?"audio/wav":ext==="pdf"?"application/pdf":"text/plain"}

export default function Messages(){
 const[items,setItems]=useState<Conversation[]>([]),[active,setActive]=useState<any>(),[body,setBody]=useState(""),[error,setError]=useState(""),[sending,setSending]=useState(false),[uploading,setUploading]=useState(false),[attachments,setAttachments]=useState<PendingAttachment[]>([]);
 async function load(){try{setItems(await api<Conversation[]>("/messages/conversations",{},true))}catch(e){setError(e instanceof Error?e.message:"Unable to load messages")}}
 useEffect(()=>{void load();const t=setInterval(()=>void load(),6000);return()=>clearInterval(t)},[]);
 async function open(id:string){try{const c=await api<any>("/messages/conversations/"+id,{},true);setActive(c);await api("/messages/"+id+"/read",{method:"POST"},true)}catch(e){setError(e instanceof Error?e.message:"Unable to open conversation")}}
 async function pick(){
  if(!active||uploading)return;
  setUploading(true);setError("");
  try{
   const result=await DocumentPicker.getDocumentAsync({multiple:true,copyToCacheDirectory:true,type:"*/*"});
   if(result.canceled)return;
   const uploaded:PendingAttachment[]=[];
   for(const asset of result.assets){
    const blob=await (await fetch(asset.uri)).blob();const contentType=mime(asset.name,asset.mimeType||blob.type);
    if(blob.size>50*1024*1024)throw new Error(`${asset.name} is larger than 50 MB`);
    const signed=await api<any>("/messages/attachments/signed-url",{method:"POST",body:JSON.stringify({conversationId:active.id,filename:asset.name,contentType,sizeBytes:blob.size})},true);
    const put=await fetch(signed.uploadUrl,{method:"PUT",headers:signed.headers||{"Content-Type":contentType},body:blob});
    if(!put.ok)throw new Error(`Upload failed: ${asset.name}`);
    const done=await api<PendingAttachment>("/messages/attachments/complete",{method:"POST",body:JSON.stringify({conversationId:active.id,key:signed.key,filename:asset.name,contentType})},true);
    uploaded.push(done);
   }
   setAttachments(x=>[...x,...uploaded]);
  }catch(e){setError(e instanceof Error?e.message:"Unable to upload attachment")}finally{setUploading(false)}
 }
 async function send(){
  if(!active||(!body.trim()&&!attachments.length)||sending)return;
  setSending(true);setError("");
  try{await api("/messages",{method:"POST",body:JSON.stringify({conversationId:active.id,body:body.trim()||"Attachment",attachmentIds:attachments.map(x=>x.id)})},true);setBody("");setAttachments([]);await open(active.id);await load()}
  catch(e){setError(e instanceof Error?e.message:"Unable to send message")}finally{setSending(false)}
 }
 async function openAttachment(id:string){try{const r=await api<any>(`/messages/attachments/${id}/download`,{},true);if(r.downloadUrl)await Linking.openURL(r.downloadUrl)}catch(e){setError(e instanceof Error?e.message:"Unable to open attachment")}}
 return <SafeAreaView style={styles.safe}><View style={styles.wrap}><Text style={styles.title}>Messages</Text>{error&&<Text style={styles.error}>{error}</Text>}
 <FlatList style={{flex:1}} data={items} keyExtractor={x=>x.id} ListEmptyComponent={<Text style={styles.muted}>No conversations yet.</Text>} renderItem={({item})=><Pressable style={styles.item} onPress={()=>void open(item.id)}><Text style={styles.itemTitle}>{active?.id===item.id?"● ":""}Conversation</Text><Text style={styles.muted}>{item.propertyId?"Property "+item.propertyId:"General inquiry"}</Text><Text style={styles.muted}>{item.memberIds.length} members</Text></Pressable>}/>
 {active&&<View style={styles.thread}><Text style={styles.threadTitle}>Conversation</Text><FlatList data={active.messages||[]} keyExtractor={(x:any)=>x.id} style={styles.history} renderItem={({item}:any)=><View style={styles.bubble}><Text>{item.body}</Text>{(item.attachments||[]).map((a:any)=><Pressable key={a.id} onPress={()=>void openAttachment(a.id)}><Text style={styles.attachment}>↗ {a.filename}</Text></Pressable>)}<Text style={styles.muted}>{new Date(item.createdAt).toLocaleString()}</Text></View>}/>
 <View style={styles.compose}><TextInput value={body} onChangeText={setBody} placeholder="Write a message…" style={styles.input}/><Pressable onPress={()=>void pick()} style={styles.attach}><Text>{uploading?"…":"＋"}</Text></Pressable><Pressable disabled={sending||(!body.trim()&&!attachments.length)} onPress={()=>void send()} style={styles.send}><Text style={styles.sendText}>{sending?"…":"Send"}</Text></Pressable></View>
 {attachments.length>0&&<View style={styles.pending}>{attachments.map(a=><Text key={a.id} style={styles.muted}>Attached: {a.filename}</Text>)}</View>}
 </View>}</View></SafeAreaView>
}
const styles=StyleSheet.create({safe:{flex:1,backgroundColor:"#f7f8fa"},wrap:{padding:18,flex:1},title:{fontSize:32,fontWeight:"900",marginBottom:12},item:{backgroundColor:"#fff",padding:14,borderRadius:16,marginBottom:8,borderWidth:1,borderColor:"#e2e8f0"},itemTitle:{fontWeight:"900",fontSize:16},muted:{color:"#656f6b",lineHeight:19,fontSize:11},error:{color:"#a5332a",marginBottom:8},thread:{backgroundColor:"#fff",borderRadius:16,borderWidth:1,borderColor:"#e2e8f0",padding:12,marginTop:8,height:390},threadTitle:{fontWeight:"900",fontSize:17},history:{marginTop:8},bubble:{padding:9,borderRadius:10,backgroundColor:"#f5f7f9",marginBottom:7},attachment:{color:"#0f5132",fontWeight:"800",marginTop:6},compose:{flexDirection:"row",gap:7,marginTop:8},input:{flex:1,borderWidth:1,borderColor:"#e2e8f0",borderRadius:10,paddingHorizontal:10},attach:{backgroundColor:"#eef3f0",borderRadius:10,paddingHorizontal:12,justifyContent:"center"},send:{backgroundColor:"#0f5132",borderRadius:10,paddingHorizontal:14,justifyContent:"center"},sendText:{color:"#fff",fontWeight:"900"},pending:{marginTop:6,gap:2}});
