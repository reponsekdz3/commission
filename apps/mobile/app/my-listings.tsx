import{router}from"expo-router";
import{useMutation,useQuery,useQueryClient}from"@tanstack/react-query";
import{useState}from"react";
import{FlatList,StyleSheet,Text,View}from"react-native";
import{api}from"../src/lib/api";
import{pickAndUploadPropertyMedia}from"../src/lib/media";
import{PropertyCardSkeleton}from"../src/components/ui";
import{Button}from"../src/components/ui";
import{useTheme}from"../src/stores/theme";
import{fonts,spacing}from"../src/theme";

export default function MyListings(){
 const c=useTheme(s=>s.palette);const qc=useQueryClient();const[busy,setBusy]=useState("");
 const q=useQuery({queryKey:["owned-properties"],queryFn:()=>api<any[]>("/properties/owned",{},true)});
 const publish=useMutation({mutationFn:(id:string)=>api("/properties/"+id+"/publish",{method:"POST"},true),onSuccess:()=>qc.invalidateQueries({queryKey:["owned-properties"]})});
 async function media(id:string){setBusy(id);try{await pickAndUploadPropertyMedia(id,"PHOTO");qc.invalidateQueries({queryKey:["owned-properties"]})}catch{}finally{setBusy("")}}
 const data=q.data||[];
 return <View style={[s.root,{backgroundColor:c.bg}]}><FlatList data={data} keyExtractor={(x:any)=>x.id} refreshing={q.isRefetching} onRefresh={()=>void q.refetch()} contentContainerStyle={s.pad}
   ListHeaderComponent={<View style={s.head}><View><Text style={[s.eyebrow,{color:c.primary,fontFamily:fonts.sansBold}]}>OWNER INVENTORY</Text><Text style={[s.h1,{color:c.text,fontFamily:fonts.displayStrong}]}>My listings</Text></View><Button title="+ Add" size="sm" onPress={()=>router.push("/add-property")}/></View>}
   ListEmptyComponent={q.isPending?<PropertyCardSkeleton/>:<Text style={{color:c.muted,textAlign:"center",padding:40}}>You have no owned properties yet.</Text>}
   renderItem={({item})=><View style={[s.card,{backgroundColor:c.surface,borderColor:c.border}]}><Text style={[s.title,{color:c.text}]}>{item.title}</Text><Text style={{color:c.muted}}>{item.status} · {item.verificationStatus}</Text><View style={s.row}><Button title="Open" size="sm" variant="ghost" onPress={()=>router.push("/property/"+item.id)}/><Button title={busy===item.id?"Uploading…":"Add photos"} size="sm" onPress={()=>void media(item.id)} disabled={busy===item.id}/>{item.status!=="PUBLISHED"&&<Button title={publish.isPending?"Publishing…":"Publish"} size="sm" variant="accent" onPress={()=>publish.mutate(item.id)} disabled={publish.isPending}/>}</View></View>}/>
 </View>;
}
const s=StyleSheet.create({root:{flex:1},pad:{padding:spacing.lg,paddingBottom:100},head:{flexDirection:"row",justifyContent:"space-between",alignItems:"flex-end",marginBottom:17},eyebrow:{fontSize:11,letterSpacing:2},h1:{fontSize:34,marginTop:5},card:{borderWidth:1,borderRadius:18,padding:15,marginBottom:10},title:{fontSize:17,fontWeight:"900",marginBottom:5},row:{flexDirection:"row",gap:7,marginTop:12,flexWrap:"wrap"}});