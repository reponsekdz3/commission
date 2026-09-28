import{useQuery,useMutation,useQueryClient}from"@tanstack/react-query";
import{router}from"expo-router";
import{ActivityIndicator,FlatList,Pressable,StyleSheet,Text,View}from"react-native";
import{api}from"../src/lib/api";
import{useTheme}from"../src/stores/theme";
import{fonts,spacing}from"../src/theme";
import{Button}from"../src/components/ui";

export default function Notifications(){
 const c=useTheme(s=>s.palette);const qc=useQueryClient();
 const q=useQuery({queryKey:["notifications"],queryFn:()=>api<any[]>("/notifications",{},true)});
 const read=useMutation({mutationFn:()=>api("/notifications/read-all",{method:"PATCH"},true),onSuccess:()=>qc.invalidateQueries({queryKey:["notifications"]})});
 return <View style={[s.root,{backgroundColor:c.bg}]}><FlatList data={q.data||[]} contentContainerStyle={s.pad} keyExtractor={x=>x.id}
   refreshing={q.isRefetching} onRefresh={()=>void q.refetch()}
   ListHeaderComponent={<View style={s.head}><View><Text style={[s.eyebrow,{color:c.primary,fontFamily:fonts.sansBold}]}>ACTIVITY</Text><Text style={[s.h1,{color:c.text,fontFamily:fonts.displayStrong}]}>Notifications</Text></View>{(q.data||[]).some((x:any)=>!(x.read_at||x.readAt))&&<Button title="Read all" size="sm" variant="ghost" onPress={()=>read.mutate()} disabled={read.isPending}/>}</View>}
   ListEmptyComponent={q.isPending?<ActivityIndicator color={c.primary}/>:<Text style={{color:c.muted,textAlign:"center",padding:40}}>No notifications yet.</Text>}
   renderItem={({item})=><Pressable onPress={()=>{const d=item.data||item.payload||{};if(d.bookingId)router.push({pathname:"/booking/[id]",params:{id:String(d.bookingId)}});else if(d.propertyId)router.push({pathname:"/property/[id]",params:{id:String(d.propertyId)}});else if(d.threadId)router.push({pathname:"/chat/[threadId]",params:{threadId:String(d.threadId)}})}} style={[s.row,{backgroundColor:c.surface,borderColor:c.border,opacity:(item.read_at||item.readAt)?0.72:1}]}><Text style={[s.bold,{color:c.text}]}>{item.title||item.type||"Notification"}</Text><Text style={[s.body,{color:c.muted}]}>{item.body||item.message||""}</Text></Pressable>}/>
 </View>;
}
const s=StyleSheet.create({root:{flex:1},pad:{padding:spacing.lg,paddingBottom:100},head:{flexDirection:"row",alignItems:"flex-end",justifyContent:"space-between",marginBottom:18},eyebrow:{fontSize:11,letterSpacing:2},h1:{fontSize:32,marginTop:4},row:{borderWidth:1,borderRadius:17,padding:15,marginBottom:9},bold:{fontWeight:"900",fontSize:16},body:{marginTop:6,lineHeight:20}});