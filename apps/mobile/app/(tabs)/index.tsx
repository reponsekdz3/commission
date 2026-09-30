import { router } from "expo-router";
import { useState } from "react";
import { ActivityIndicator, FlatList, Pressable, SafeAreaView, StyleSheet, Text, View } from "react-native";
import { useQuery } from "@tanstack/react-query";
import { Ionicons } from "@expo/vector-icons";
import { api, SearchItem } from "../../src/lib/api";
import { PropertyCard } from "../../src/components/PropertyCard";
import { Button, Chip, Field, OfflineBanner, SectionTitle } from "../../src/components/ui";
import { fonts, spacing, typography } from "../../src/theme";
import { useTheme } from "../../src/stores/theme";
import { selection } from "../../src/lib/haptics";

export default function Home(){
 const c=useTheme(s=>s.palette);const[q,setQ]=useState("");const[type,setType]=useState("RENT");
 const query=useQuery({queryKey:["search",{listingType:type,limit:12}],queryFn:()=>api<{items:SearchItem[]}>("/search?listingType="+type+"&limit=12")});
 const items=query.data?.items??[];const search=()=>{selection();router.push({pathname:"/search",params:{q,listingType:type}})};
 const actions=[["map","Explore map","Live locations","/map"],["heart","Saved","Your shortlist","/saved"],["calendar","Bookings","Viewings & stays","/bookings"],["add-circle","List property","Reach seekers","/add-property"]] as const;
 const header=<View>
   <View style={[s.hero,{backgroundColor:c.surface,borderColor:c.border}]}>
    <Text style={[s.eyebrow,{color:c.primary,fontFamily:fonts.sansBold}]}>IMIZI · RWANDA</Text>
    <Text style={[s.h1,{color:c.text,fontFamily:fonts.displayStrong}]}>Find a place that fits.</Text>
    <Text style={[s.lead,{color:c.muted,fontFamily:fonts.sans}]}>Homes, land and commercial spaces with search, maps, viewings, bookings, payments and messaging connected to one account.</Text>
    <View style={s.search}><Field value={q} onChangeText={setQ} onSubmitEditing={search} placeholder="Kacyiru · 3 bedrooms · 800k" style={s.field}/><Button title="Search properties" onPress={search}/></View>
    <View style={s.chips}>{["RENT","SALE","SHORT_STAY"].map(x=><Chip key={x} label={x==="SHORT_STAY"?"STAY":x} active={type===x} onPress={()=>{selection();setType(x)}}/>)}</View>
   </View>
   <View style={s.actions}>{actions.map(([icon,title,sub,path])=><Pressable key={title} onPress={()=>{selection();router.push(path as any)}} style={[s.action,{backgroundColor:c.surface,borderColor:c.border}]}><View style={[s.icon,{backgroundColor:c.primarySoft}]}><Ionicons name={icon as any} size={20} color={c.primary}/></View><Text style={[s.actionTitle,{color:c.text}]}>{title}</Text><Text style={[s.actionSub,{color:c.muted}]}>{sub}</Text></Pressable>)}</View>
   <View style={[s.status,{borderColor:c.border,backgroundColor:c.surface}]}><View><Text style={[s.statusTitle,{color:c.text}]}>Connected marketplace</Text><Text style={[s.statusSub,{color:c.muted}]}>Live API · maps · bookings · payments · chat</Text></View><View style={[s.liveDot,{backgroundColor:c.primary}]}/></View>
   <OfflineBanner visible={query.isError&&items.length>0}/>{query.isError&&items.length===0&&<Text style={[s.error,{color:c.danger}]}>{query.error instanceof Error?query.error.message:"Unable to load live listings."}</Text>}
   <SectionTitle title={query.isFetching?"Refreshing listings…":"Featured live listings"} action="View all" onAction={()=>router.push({pathname:"/search",params:{listingType:type}})}/>
 </View>;
 return <SafeAreaView style={[s.root,{backgroundColor:c.bg}]}><FlatList data={items} keyExtractor={x=>x.listing.id} contentContainerStyle={s.pad} refreshing={query.isFetching} onRefresh={()=>void query.refetch()} ListHeaderComponent={header} renderItem={({item})=><PropertyCard item={item} onPress={()=>router.push("/property/"+item.property.id)}/>} ListEmptyComponent={query.isPending?<ActivityIndicator/>:<View style={s.empty}><Text style={[s.emptyTitle,{color:c.text}]}>No live listings</Text><Text style={{color:c.muted,textAlign:"center"}}>Try another property type or open Search for more filters.</Text><Button title="Open advanced search" onPress={()=>router.push("/search")}/></View>}/></SafeAreaView>;
}
const s=StyleSheet.create({root:{flex:1},pad:{padding:spacing.md,paddingBottom:110},hero:{padding:18,borderWidth:1,borderRadius:24,marginTop:spacing.md},eyebrow:{fontSize:11,letterSpacing:2},h1:{fontSize:typography.display,letterSpacing:-1.4,marginTop:7},lead:{fontSize:15,lineHeight:23,marginTop:8},search:{gap:8,marginTop:20},field:{marginBottom:2},chips:{flexDirection:"row",gap:8,marginTop:10,flexWrap:"wrap"},actions:{flexDirection:"row",flexWrap:"wrap",gap:9,marginTop:12},action:{width:"48.5%",minHeight:96,borderWidth:1,borderRadius:18,padding:12},icon:{width:38,height:38,borderRadius:12,alignItems:"center",justifyContent:"center",marginBottom:7},actionTitle:{fontWeight:"900",fontSize:14},actionSub:{fontSize:11,marginTop:2},status:{marginTop:12,padding:13,borderRadius:16,borderWidth:1,flexDirection:"row",alignItems:"center",justifyContent:"space-between"},statusTitle:{fontWeight:"900",fontSize:13},statusSub:{fontSize:11,marginTop:3},liveDot:{width:9,height:9,borderRadius:5},error:{marginTop:10},empty:{padding:26,alignItems:"center",gap:10},emptyTitle:{fontSize:21,fontWeight:"900"}});