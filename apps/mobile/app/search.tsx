import { useLocalSearchParams,useRouter } from "expo-router";
import { useEffect,useMemo,useState } from "react";
import { ActivityIndicator,FlatList,Pressable,SafeAreaView,StyleSheet,Text,View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { api,SearchItem } from "../src/lib/api";
import { PropertyCard } from "../src/components/PropertyCard";
import { cacheJson,readCached } from "../src/lib/cache";
import { useTheme } from "../src/stores/theme";
import { fonts } from "../src/theme";
import { Chip,Field } from "../src/components/ui";
import { selection } from "../src/lib/haptics";

const TYPES=[["","All"],["RENT","Rent"],["SALE","Buy"],["SHORT_STAY","Stay"]] as const;

export default function SearchScreen(){
 const c=useTheme(s=>s.palette);
 const params=useLocalSearchParams<{q?:string;listingType?:string;district?:string;verifiedOnly?:string}>();
 const router=useRouter();
 const [q,setQ]=useState(String(params.q??""));
 const [type,setType]=useState(String(params.listingType??""));
 const [district,setDistrict]=useState(String(params.district??""));
 const [verified,setVerified]=useState(String(params.verifiedOnly??"") === "true");
 const [min,setMin]=useState("");
 const [max,setMax]=useState("");
 const [items,setItems]=useState<SearchItem[]>([]);
 const [loading,setLoading]=useState(true);
 const [refreshing,setRefreshing]=useState(false);
 const [error,setError]=useState("");
 const queryString=useMemo(()=>{const p=new URLSearchParams();if(q.trim())p.set("q",q.trim());if(type)p.set("listingType",type);if(district.trim())p.set("district",district.trim());if(min)p.set("minPriceMinor",String(Math.round(Number(min)*100)));if(max)p.set("maxPriceMinor",String(Math.round(Number(max)*100)));if(verified)p.set("verifiedOnly","true");p.set("limit","60");return p.toString();},[q,type,district,min,max,verified]);
 async function run(nextQ=q){
   setLoading(true);setError("");
   try{const qs=new URLSearchParams(queryString);const term=nextQ.trim();if(term)qs.set("q",term);else qs.delete("q");const data=await api<{items:SearchItem[]}>("/search?"+qs.toString());setItems(data.items??[]);await cacheJson("search:"+qs.toString(),data.items??[]);}
   catch(e){const cached=await readCached<SearchItem[]>("search:"+queryString);if(cached){setItems(cached);setError("Offline mode · showing cached results.");}else setError(e instanceof Error?e.message:"Search failed");}
   finally{setLoading(false);setRefreshing(false);}
 }
 useEffect(()=>{void run(String(params.q??""));},[params.q,params.listingType,params.district,params.verifiedOnly]);
 return <SafeAreaView style={[s.safe,{backgroundColor:c.bg}]}><View style={s.wrap}>
  <View style={s.header}><View><Text style={[s.eyebrow,{color:c.primary,fontFamily:fonts.sansBold}]}>DISCOVERY</Text><Text style={[s.title,{color:c.text,fontFamily:fonts.displayStrong}]}>Find your next place.</Text></View><Pressable onPress={()=>{selection();router.push("/map")}} style={[s.iconButton,{backgroundColor:c.surface,borderColor:c.border}]}><Ionicons name="map-outline" size={20} color={c.primary}/></Pressable></View>
  <View style={[s.searchRow,{backgroundColor:c.surface,borderColor:c.border}]}><Field value={q} onChangeText={setQ} onSubmitEditing={()=>void run()} placeholder="Kigali · 3 bedrooms · 800k" returnKeyType="search" style={s.input}/><Pressable onPress={()=>{selection();void run()}} style={[s.go,{backgroundColor:c.primary}]}><Ionicons name="search" size={19} color={c.primaryFg}/></Pressable></View>
  <View style={s.chipsRow}>{TYPES.map(([value,label])=><Chip key={value||"all"} label={label} active={type===value} onPress={()=>{selection();setType(value);}}/>)}<Chip label={verified?"✓ Verified":"Verified"} active={verified} onPress={()=>{selection();setVerified(v=>!v)}}/></View>
  <View style={[s.advanced,{backgroundColor:c.surface,borderColor:c.border}]}><Field value={district} onChangeText={setDistrict} placeholder="District e.g. Gasabo" style={s.smallField}/><Field value={min} onChangeText={setMin} placeholder="Min RWF" keyboardType="number-pad" style={s.smallField}/><Field value={max} onChangeText={setMax} placeholder="Max RWF" keyboardType="number-pad" style={s.smallField}/><Pressable onPress={()=>{selection();void run()}} style={[s.apply,{backgroundColor:c.text}]}><Text style={{color:c.bg,fontFamily:fonts.sansBold,fontSize:12}}>Apply</Text></Pressable></View>
  <View style={s.resultsHead}><Text style={[s.results,{color:c.text,fontFamily:fonts.sansBold}]}>{loading?"Searching…":String(items.length)+" "+(items.length===1?"property":"properties")}</Text><Text style={[s.live,{color:c.muted,fontFamily:fonts.sans}]}>Live backend</Text></View>
  {error&&<View style={[s.offlineWrap,{backgroundColor:c.accentSoft}]}><Text style={[s.error,{color:c.warning,fontFamily:fonts.sans}]}>{error}</Text></View>}
  {loading ? (
    <ActivityIndicator color={c.primary} style={{marginTop:30}} />
  ) : (
    <FlatList
      data={items}
      refreshing={refreshing}
      onRefresh={()=>{setRefreshing(true);void run(q);}}
      keyExtractor={x=>x.listing.id}
      contentContainerStyle={{paddingTop:10,paddingBottom:34,flexGrow:1}}
      ListEmptyComponent={
        <View style={[s.empty,{backgroundColor:c.surface,borderColor:c.border}]}>
          <Ionicons name="search-outline" size={34} color={c.subtle}/>
          <Text style={[s.emptyTitle,{color:c.text,fontFamily:fonts.displayStrong}]}>No matches</Text>
          <Text style={[s.emptyText,{color:c.muted,fontFamily:fonts.sans}]}>Try another district, price range or listing type.</Text>
        </View>
      }
      renderItem={({item})=>(
        <PropertyCard item={item} onPress={()=>router.push({pathname:"/property/[id]",params:{id:item.property.id}})}/>
      )}
    />
  )}
 </View></SafeAreaView>;
}
const s=StyleSheet.create({safe:{flex:1},wrap:{flex:1,paddingHorizontal:14,paddingTop:10},header:{flexDirection:"row",alignItems:"center",justifyContent:"space-between",marginBottom:10},eyebrow:{fontSize:10,letterSpacing:1.7,marginBottom:4},title:{fontSize:25,letterSpacing:-.7},iconButton:{width:44,height:44,borderRadius:14,borderWidth:1,alignItems:"center",justifyContent:"center"},searchRow:{flexDirection:"row",alignItems:"center",borderWidth:1,borderRadius:16,padding:4,marginBottom:9},input:{flex:1,borderWidth:0},go:{width:46,height:46,borderRadius:13,alignItems:"center",justifyContent:"center"},chipsRow:{flexDirection:"row",gap:7,flexWrap:"wrap",marginBottom:9},advanced:{flexDirection:"row",gap:7,alignItems:"center",borderWidth:1,borderRadius:16,padding:8},smallField:{flex:1,minWidth:0},apply:{height:42,paddingHorizontal:13,borderRadius:11,alignItems:"center",justifyContent:"center"},resultsHead:{flexDirection:"row",justifyContent:"space-between",alignItems:"center",paddingVertical:12},results:{fontSize:14},live:{fontSize:11},error:{fontSize:12,paddingVertical:4},empty:{flex:1,minHeight:220,borderWidth:1,borderStyle:"dashed",borderRadius:20,alignItems:"center",justifyContent:"center",padding:28},emptyTitle:{fontSize:19,marginTop:10},emptyText:{fontSize:13,lineHeight:20,textAlign:"center",marginTop:6},offlineWrap:{padding:8,borderRadius:10,marginTop:5}});