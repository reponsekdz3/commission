import { useLocalSearchParams,useRouter } from "expo-router";
import { useEffect,useState } from "react";
import { ActivityIndicator,FlatList,SafeAreaView,StyleSheet,Text,TextInput,View } from "react-native";
import { api,SearchItem } from "../src/lib/api";
import { PropertyCard } from "../src/components/PropertyCard";
import { cacheJson,readCached } from "../src/lib/cache";
import { useTheme } from "../src/stores/theme";
import { fonts } from "../src/theme";

export default function SearchScreen(){
 const c=useTheme(s=>s.palette);
 const params=useLocalSearchParams<{q?:string}>();
 const router=useRouter();
 const [q,setQ]=useState(String(params.q??""));
 const [items,setItems]=useState<SearchItem[]>([]);
 const [loading,setLoading]=useState(true);
 const [refreshing,setRefreshing]=useState(false);
 const [error,setError]=useState("");

 async function run(text=q){
  setLoading(true);setError("");
  try{
   const term=text.trim();
   const data=await api<{items:SearchItem[]}>(term?"/search?q="+encodeURIComponent(term):"/search");
   setItems(data.items??[]);
   await cacheJson("search:"+term,data.items??[]);
  }catch(e){
   const cached=await readCached<SearchItem[]>("search:"+text.trim());
   if(cached){setItems(cached);setError("Offline mode: showing cached results.");}
   else setError(e instanceof Error?e.message:"Search failed");
  }finally{setLoading(false);setRefreshing(false);}
 }

 useEffect(()=>{void run(String(params.q??""));},[params.q]);

 return <SafeAreaView style={[s.safe,{backgroundColor:c.bg}]}>
  <View style={s.wrap}>
   <View style={[s.searchRow,{backgroundColor:c.surface,borderColor:c.border}]}>
    <TextInput value={q} onChangeText={setQ} onSubmitEditing={()=>void run()} placeholder="Search homes, land, apartments..." placeholderTextColor={c.subtle} style={[s.input,{color:c.text}]}/>
   </View>
   {loading?<ActivityIndicator color={c.primary} style={{marginTop:30}}/>:
    <FlatList
     data={items}
     refreshing={refreshing}
     onRefresh={()=>{setRefreshing(true);void run(q);}}
     keyExtractor={x=>x.listing.id}
     contentContainerStyle={{paddingTop:14,paddingBottom:30,flexGrow:1}}
     ListEmptyComponent={<Text style={[s.muted,{color:c.muted}]}>No properties matched your search. Try another district, price or property type.</Text>}
     renderItem={({item})=><PropertyCard item={item} onPress={()=>router.push({pathname:"/property/[id]",params:{id:item.property.id}})}/>}
    />}
   {!!error&&<Text style={[s.error,{color:c.warning}]}>{error}</Text>}
  </View>
 </SafeAreaView>;
}
const s=StyleSheet.create({safe:{flex:1},wrap:{flex:1,padding:16},searchRow:{borderRadius:14,borderWidth:1},input:{padding:14,fontSize:16},error:{marginTop:12},muted:{marginTop:30,textAlign:"center",paddingHorizontal:20,fontFamily:fonts.sans}});
