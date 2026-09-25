
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from "react-native";
import { api, Property } from "../../src/lib/api";
import { cacheJson, readCached } from "../../src/lib/cache";

export default function PropertyDetails(){
  const {id}=useLocalSearchParams<{id:string}>();
  const router=useRouter();
  const [property,setProperty]=useState<Property|null>(null);
  const [error,setError]=useState("");
  useEffect(()=>{
    if(!id)return;
    api<Property>("/properties/"+id,{auth:false}).then(data=>{setProperty(data);void cacheJson("property:"+id,data);}).catch(async e=>{
      const cached=await readCached<Property>("property:"+id);
      if(cached){setProperty(cached);setError("Offline mode: showing cached property.");}
      else setError(e instanceof Error?e.message:"Property failed");
    });
  },[id]);
  if(error)return <SafeAreaView style={styles.safe}><Text style={styles.error}>{error}</Text></SafeAreaView>;
  if(!property)return <SafeAreaView style={styles.safe}><ActivityIndicator style={{marginTop:40}}/></SafeAreaView>;
  const listing=property.listings?.find(x=>x.status==="ACTIVE")??property.listings?.[0];
  return <SafeAreaView style={styles.safe}><ScrollView contentContainerStyle={styles.wrap}>
    <View style={styles.hero}><Text style={styles.heroText}>PROPERTY</Text></View>
    <Text style={styles.badge}>{property.verificationStatus==="VERIFIED"?"VERIFIED OWNER / PROPERTY":"UNVERIFIED"}</Text>
    <Text style={styles.title}>{property.title}</Text>
    <Text style={styles.muted}>{property.district}, {property.province} · {property.propertyType}</Text>
    {listing&&<Text style={styles.price}>{new Intl.NumberFormat("en-RW",{maximumFractionDigits:0}).format(listing.priceMinor)} {listing.currency}{listing.listingType==="RENT"? " / month":""}</Text>}
    <View style={styles.stats}><Text>{property.bedrooms??0} beds</Text><Text>{property.bathrooms??0} baths</Text><Text>{property.parking??0} parking</Text></View>
    <Text style={styles.section}>Description</Text><Text style={styles.body}>{property.description}</Text>
    <Text style={styles.section}>Amenities</Text><View style={styles.tags}>{(property.amenities??[]).map(a=><Text key={a} style={styles.tag}>{a}</Text>)}</View>
    <View style={styles.buttons}>
      {listing&&<Pressable style={styles.primary} onPress={()=>router.push({pathname:"/booking",params:{listingId:listing.id}})}><Text style={styles.primaryText}>Book</Text></Pressable>}
      <Pressable style={styles.secondary} onPress={()=>router.push("/messages")}><Text style={styles.secondaryText}>Messages</Text></Pressable>
      <Pressable style={styles.secondary} onPress={()=>router.push({pathname:"/map",params:{lat:String(property.latitude),lng:String(property.longitude)}})}><Text style={styles.secondaryText}>Map</Text></Pressable>
    </View>
  </ScrollView></SafeAreaView>;
}
const styles=StyleSheet.create({
 safe:{flex:1,backgroundColor:"#f7f3eb"},wrap:{padding:18,gap:10},
 hero:{height:220,backgroundColor:"#dce7e0",borderRadius:20,alignItems:"center",justifyContent:"center"},
 heroText:{fontSize:38,fontWeight:"900",letterSpacing:4,color:"#21583f"},badge:{fontSize:11,fontWeight:"900",color:"#21583f",marginTop:8},
 title:{fontSize:30,fontWeight:"900",lineHeight:34},muted:{color:"#65615b"},price:{fontSize:24,fontWeight:"900",marginTop:8},
 stats:{backgroundColor:"#fff",borderRadius:16,padding:16,flexDirection:"row",justifyContent:"space-between"},
 section:{fontSize:18,fontWeight:"900",marginTop:16},body:{fontSize:16,lineHeight:24,color:"#403e39"},
 tags:{flexDirection:"row",flexWrap:"wrap",gap:8},tag:{backgroundColor:"#fff",paddingHorizontal:12,paddingVertical:8,borderRadius:20},
 buttons:{gap:10,marginTop:14},primary:{backgroundColor:"#21583f",padding:15,borderRadius:14,alignItems:"center"},
 primaryText:{color:"#fff",fontWeight:"900",fontSize:16},secondary:{backgroundColor:"#e7efe9",padding:15,borderRadius:14,alignItems:"center"},
 secondaryText:{color:"#21583f",fontWeight:"900"},error:{padding:20,color:"#a5332a"}
});
