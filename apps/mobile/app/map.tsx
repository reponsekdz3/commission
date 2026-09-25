
import * as Location from "expo-location";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, View, StyleSheet, Text } from "react-native";
import MapView, { Marker, Region } from "react-native-maps";
import { api, SearchItem } from "../src/lib/api";

export default function MapScreen(){
  const params=useLocalSearchParams<{lat?:string;lng?:string}>();
  const router=useRouter();
  const [region,setRegion]=useState<Region|null>(null);
  const [items,setItems]=useState<SearchItem[]>([]);

  useEffect(()=>{
    async function load(){
      let lat=Number(params.lat),lng=Number(params.lng);
      if(!Number.isFinite(lat)||!Number.isFinite(lng)){
        const permission=await Location.requestForegroundPermissionsAsync();
        if(permission.status!=="granted")return;
        const pos=await Location.getCurrentPositionAsync({accuracy:Location.Accuracy.Balanced});
        lat=pos.coords.latitude;lng=pos.coords.longitude;
      }
      setRegion({latitude:lat,longitude:lng,latitudeDelta:.08,longitudeDelta:.08});
      const data=await api<{items:SearchItem[]}>("/search?lat="+lat+"&lng="+lng+"&radiusKm=5&limit=30",{auth:false});
      setItems(data.items);
    }
    load().catch(()=>{});
  },[params.lat,params.lng]);

  if(!region)return <View style={styles.loading}><ActivityIndicator/></View>;
  return <View style={styles.root}>
    <MapView style={styles.map} initialRegion={region} onRegionChangeComplete={setRegion}>
      {items.map(item=><Marker key={item.listing.id} coordinate={{latitude:item.property.latitude,longitude:item.property.longitude}} title={item.property.title} description={item.property.district} onCalloutPress={()=>router.push({pathname:"/property/[id]",params:{id:item.property.id}})}/>)}
    </MapView>
    <View style={styles.overlay}><Text style={styles.overlayText}>{items.length} nearby properties</Text></View>
  </View>;
}
const styles=StyleSheet.create({root:{flex:1},loading:{flex:1,alignItems:"center",justifyContent:"center",backgroundColor:"#f7f3eb"},map:{flex:1},overlay:{position:"absolute",top:60,left:20,right:20,backgroundColor:"#fff",padding:12,borderRadius:14},overlayText:{fontWeight:"800",textAlign:"center"}});
