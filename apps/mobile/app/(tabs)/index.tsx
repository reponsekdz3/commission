import { router } from "expo-router";
import { useState } from "react";
import { ActivityIndicator, FlatList, SafeAreaView, StyleSheet, Text, View } from "react-native";
import { useQuery } from "@tanstack/react-query";
import { api, SearchItem } from "../../src/lib/api";
import { PropertyCard } from "../../src/components/PropertyCard";
import { Button, Chip, Field, OfflineBanner, SectionTitle } from "../../src/components/ui";
import { fonts, spacing, typography } from "../../src/theme";
import { useTheme } from "../../src/stores/theme";
export default function Home(){
 const c=useTheme(s=>s.palette); const[q,setQ]=useState(""); const[type,setType]=useState("RENT");
 const query=useQuery({queryKey:["search",{listingType:type,limit:12}],queryFn:()=>api<{items:SearchItem[]}>("/search?listingType="+type+"&limit=12")});
 const items=query.data?.items??[]; const search=()=>router.push({pathname:"/search",params:{q,listingType:type}});
 const header=<View>
   <Text style={[s.eyebrow,{color:c.primary,fontFamily:fonts.sansBold}]}>IMIZI · RWANDA</Text>
   <Text style={[s.h1,{color:c.text,fontFamily:fonts.displayStrong}]}>Find a place that fits.</Text>
   <Text style={[s.lead,{color:c.muted,fontFamily:fonts.sans}]}>Live listings, viewings, bookings, payments and rental management in one secure platform.</Text>
   <View style={s.search}><Field value={q} onChangeText={setQ} onSubmitEditing={search} placeholder="Kacyiru · 3 bedrooms · 800k" style={s.field}/><Button title="Search" onPress={search}/></View>
   <View style={s.chips}>{["RENT","SALE","SHORT_STAY"].map(x=><Chip key={x} label={x==="SHORT_STAY"?"STAY":x} active={type===x} onPress={()=>setType(x)}/>)}</View>
   <OfflineBanner visible={query.isError&&items.length>0}/>
   {query.isError&&items.length===0&&<Text style={[s.error,{color:c.danger}]}>{query.error instanceof Error?query.error.message:"Unable to load live listings."}</Text>}
   <SectionTitle title={query.isFetching?"Refreshing listings…":"Live listings"} action="Map" onAction={()=>router.push("/map")}/>
 </View>;
 return <SafeAreaView style={[s.root,{backgroundColor:c.bg}]}><FlatList data={items} keyExtractor={x=>x.listing.id} contentContainerStyle={s.pad} refreshing={query.isFetching} onRefresh={()=>void query.refetch()} ListHeaderComponent={header} renderItem={({item})=><PropertyCard item={item} onPress={()=>router.push("/property/"+item.property.id)}/>} ListEmptyComponent={query.isPending?<ActivityIndicator/>:<Text style={[s.lead,{color:c.muted}]}>No live listings are available for this selection.</Text>}/></SafeAreaView>;
}
const s=StyleSheet.create({root:{flex:1},pad:{padding:spacing.lg,paddingBottom:100},eyebrow:{fontSize:11,letterSpacing:2,marginTop:spacing.md},h1:{fontSize:typography.display,letterSpacing:-1.4,marginTop:7},lead:{fontSize:15,lineHeight:23,marginTop:8},search:{gap:8,marginTop:20},field:{marginBottom:2},chips:{flexDirection:"row",gap:8,marginTop:10,flexWrap:"wrap"},error:{marginTop:10}});