
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, FlatList, SafeAreaView, StyleSheet, Text, TextInput, View } from "react-native";
import { api, SearchItem } from "../src/lib/api";
import { PropertyCard } from "../src/components/PropertyCard";

export default function SearchScreen(){
  const params=useLocalSearchParams<{q?:string}>();
  const router=useRouter();
  const [q,setQ]=useState(params.q??"");
  const [items,setItems]=useState<SearchItem[]>([]);
  const [loading,setLoading]=useState(true);
  const [error,setError]=useState("");
  async function run(text=q){
    setLoading(true);setError("");
    try{
      const query=text.trim()?"/search?q="+encodeURIComponent(text.trim()):"/search";
      const data=await api<{items:SearchItem[]}>(query,{auth:false});
      setItems(data.items);
    }catch(e){setError(e instanceof Error?e.message:"Search failed");}
    finally{setLoading(false);}
  }
  useEffect(()=>{run(params.q??"");},[params.q]);
  return <SafeAreaView style={styles.safe}><View style={styles.wrap}>
    <View style={styles.searchRow}><TextInput value={q} onChangeText={setQ} onSubmitEditing={()=>run()} placeholder="Search homes, land, apartments..." style={styles.input}/></View>
    {loading?<ActivityIndicator style={{marginTop:30}/>:error?<Text style={styles.error}>{error}</Text>:
      <FlatList data={items} keyExtractor={x=>x.listing.id} contentContainerStyle={{paddingTop:14,paddingBottom:30}}
        ListEmptyComponent={<Text style={styles.muted}>No properties matched your search.</Text>}
        renderItem={({item})=><PropertyCard item={item} onPress={()=>router.push({pathname:"/property/[id]",params:{id:item.property.id}})}/>}
      />}
  </View></SafeAreaView>;
}
const styles=StyleSheet.create({safe:{flex:1,backgroundColor:"#f7f3eb"},wrap:{flex:1,padding:16},searchRow:{backgroundColor:"#fff",borderRadius:14,borderWidth:1,borderColor:"#e7e2da"},input:{padding:14,fontSize:16},error:{color:"#a5332a",marginTop:20},muted:{color:"#68645e",marginTop:30,textAlign:"center"}});
