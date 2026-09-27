
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, FlatList, SafeAreaView, StyleSheet, Text, TextInput, View } from "react-native";
import { api, SearchItem } from "../src/lib/api";
import { PropertyCard } from "../src/components/PropertyCard";
import { cacheJson, readCached } from "../src/lib/cache";

export default function SearchScreen(){
  const params=useLocalSearchParams<{q?:string}>();
  const router=useRouter();
  const [q,setQ]=useState(params.q??"");
  const [items,setItems]=useState<SearchItem[]>([]);
  const [loading,setLoading]=useState(true);
  const [error,setError]=useState("");const [refreshing,setRefreshing]=useState(false);
  async function run(text=q){
    setLoading(true);setError("");
    try{
      const query=text.trim()?"/search?q="+encodeURIComponent(text.trim()):"/search";
      const data=await api<{items:SearchItem[]}>(query);
      setItems(data.items);
      await cacheJson("search:"+text.trim(),data.items);
    }catch(e){
      const cached=await readCached<SearchItem[]>("search:"+text.trim());
      if(cached){setItems(cached);setError("Offline mode: showing cached results.");}
      else setError(e instanceof Error?e.message:"Search failed");
    }
    finally{setLoading(false);setRefreshing(false);}
  }
  useEffect(()=>{run(params.q??"");},[params.q]);
  return <SafeAreaView style={[styles.safe,{backgroundColor:c.bg}]}><View style={styles.wrap}>
    <View style={[styles.searchRow,{backgroundColor:c.surface,borderColor:c.border}]}><TextInput value={q} onChangeText={setQ} onSubmitEditing={()=>run()} placeholder="Search homes, land, apartments..." style={[styles.input,{color:c.text}]}/></View>
    {loading?<ActivityIndicator style={{marginTop:30}/>:error?<Text style={styles.error}>{error}</Text>:
      <FlatList data={items} refreshing={refreshing} onRefresh={()=>void run(q,true)} keyExtractor={x=>x.listing.id} contentContainerStyle={{paddingTop:14,paddingBottom:30}}
        ListEmptyComponent={<Text style={[styles.muted,{color:c.muted}]}>{error||"No properties matched your search. Try another district, price or property type."}</Text>}
        renderItem={({item})=><PropertyCard item={item} onPress={()=>router.push({pathname:"/property/[id]",params:{id:item.property.id}})}/>}
      />}
  </View></SafeAreaView>;
}
const styles=StyleSheet.create({safe:{flex:1},wrap:{flex:1,padding:16},searchRow:{borderRadius:14,borderWidth:1},input:{padding:14,fontSize:16},error:{color:"#a5332a",marginTop:20},muted:{color:"#68645e",marginTop:30,textAlign:"center"}});
