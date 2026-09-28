import{router}from"expo-router";
import{useMutation,useQuery,useQueryClient}from"@tanstack/react-query";
import{FlatList,Pressable,StyleSheet,Text,View}from"react-native";
import{api}from"../../src/lib/api";
import{RemoteImage,Button,PropertyCardSkeleton}from"../../src/components/ui";
import{useTheme}from"../../src/stores/theme";
import{fonts,spacing}from"../../src/theme";
import{selection}from"../../src/lib/haptics";

export default function Saved(){
 const c=useTheme(s=>s.palette);const qc=useQueryClient();const q=useQuery({queryKey:["favorites"],queryFn:()=>api<any[]>("/favorites",{},true)});
 const remove=useMutation({mutationFn:(id:string)=>api("/favorites/"+id,{method:"DELETE"},true),onSuccess:()=>qc.invalidateQueries({queryKey:["favorites"]})});
 const items=q.data||[];
 return <View style={[s.root,{backgroundColor:c.bg}]}><FlatList data={items} keyExtractor={(a:any)=>a.propertyId||a.id} contentContainerStyle={s.pad} refreshing={q.isRefetching} onRefresh={()=>void q.refetch()}
 ListHeaderComponent={<View><Text style={[s.eyebrow,{color:c.primary,fontFamily:fonts.sansBold}]}>SHORTLIST</Text><Text style={[s.h1,{color:c.text,fontFamily:fonts.displayStrong}]}>Saved properties</Text><Text style={{color:c.muted}}>Your account-backed shortlist follows you across devices.</Text></View>}
 ListEmptyComponent={q.isPending?<PropertyCardSkeleton/>:<View style={s.empty}><Text style={[s.emptyTitle,{color:c.text}]}>No saved properties</Text><Text style={{color:c.muted,textAlign:"center"}}>Save a listing from its property page and it will remain attached to your account.</Text></View>}
 renderItem={({item})=>{const id=String(item.propertyId||item.id),p=item.property||item;return <Pressable onPress={()=>router.push("/property/"+id)} style={[s.card,{backgroundColor:c.surface,borderColor:c.border}]}><RemoteImage uri={p.media?.[0]?.url} style={s.image} accessibilityLabel={p.title}/><View style={{flex:1}}><Text style={[s.title,{color:c.text}]} numberOfLines={2}>{p.title||item.title||id}</Text><Text style={{color:c.muted,marginTop:4}}>{p.district||item.district||"Rwanda"}</Text><Button title="Remove" size="sm" variant="ghost" onPress={()=>{selection();remove.mutate(id)}} disabled={remove.isPending}/></View></Pressable>}}
 />;
}
const s=StyleSheet.create({root:{flex:1},pad:{padding:spacing.lg,paddingBottom:100},eyebrow:{fontSize:11,letterSpacing:2},h1:{fontSize:34,marginTop:5,marginBottom:5},card:{borderWidth:1,borderRadius:18,padding:10,marginTop:10,flexDirection:"row",gap:12},image:{width:110,height:110,borderRadius:13,backgroundColor:"#EEF2F1"},title:{fontWeight:"900",fontSize:16,lineHeight:20},empty:{padding:40,alignItems:"center"},emptyTitle:{fontWeight:"900",fontSize:22,marginBottom:7}});