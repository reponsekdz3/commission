import { router, useLocalSearchParams } from "expo-router";
import { useMemo, useRef, useState } from "react";
import { Alert, Pressable, StyleSheet, Text, View } from "react-native";
import { useQuery } from "@tanstack/react-query";
import BottomSheet, { BottomSheetFlatList } from "@gorhom/bottom-sheet";
import MapView, { Marker, Polygon, Region } from "react-native-maps";
import { api, SearchItem } from "../../src/lib/api";
import { PropertyCard } from "../../src/components/PropertyCard";
import { Button, Chip, Field, OfflineBanner } from "../../src/components/ui";
import { useTheme } from "../../src/stores/theme";
import { fonts, spacing } from "../../src/theme";
import { selection } from "../../src/lib/haptics";
import { isSignedIn } from "../../src/lib/session";

export default function Search() {
  const c = useTheme((s) => s.palette);
  const p = useLocalSearchParams<{ q?: string; listingType?: string }>();
  const [q, setQ] = useState(String(p.q || ""));
  const [type, setType] = useState(String(p.listingType || "RENT"));
  const [district, setDistrict] = useState("");
  const [min, setMin] = useState("");
  const [max, setMax] = useState("");
  const [verified, setVerified] = useState(false);
  const [region, setRegion] = useState<Region>({ latitude: -1.9441, longitude: 30.0619, latitudeDelta: 0.12, longitudeDelta: 0.12 });
  const [selected, setSelected] = useState<SearchItem | null>(null);
  const [drawing, setDrawing] = useState(false);
  const [points, setPoints] = useState<{ latitude:number; longitude:number }[]>([]);
  const sheet = useRef<BottomSheet>(null);
  const params = useMemo(() => {
    const x = new URLSearchParams({ listingType: type, limit: "60" });
    if (q) x.set("q", q); if (district) x.set("district", district);
    if (min) x.set("minPriceMinor", String(Number(min))); if (max) x.set("maxPriceMinor", String(Number(max)));
    if (verified) x.set("verifiedOnly", "true");
    if (points.length >= 3) x.set("polygon", JSON.stringify(points.map(v=>({lat:v.latitude,lng:v.longitude}))));
    x.set("lat", String(region.latitude)); x.set("lng", String(region.longitude)); x.set("radiusKm", String(Math.max(5, Math.ceil(Math.max(region.latitudeDelta, region.longitudeDelta) * 111 / 2))));
    return x.toString();
  }, [type,q,district,min,max,verified,points,region.latitude,region.longitude,region.latitudeDelta,region.longitudeDelta]);
  const query = useQuery({ queryKey: ["search", params], queryFn: () => api<{items:SearchItem[]}>("/search?" + params) });
  const items = query.data?.items ?? [];
  const visible = items;
  const addPoint = (e:any) => { if (drawing) { selection(); setPoints(v => [...v, e.nativeEvent.coordinate]); } };
  const centerOnItem = (item:SearchItem) => { setSelected(item); sheet.current?.snapToIndex(1); setRegion(r => ({...r, latitude:item.property.latitude, longitude:item.property.longitude})); selection(); };
  return <View style={[s.root,{backgroundColor:c.bg}]}>
    <MapView style={s.map} region={region} onRegionChangeComplete={setRegion} onPress={addPoint} showsUserLocation={false}>
      {visible.map(item => <Marker key={item.listing.id} coordinate={{latitude:item.property.latitude,longitude:item.property.longitude}} title={item.property.title} description={item.property.district} onPress={()=>centerOnItem(item)} />)}
      {points.length>1 && <Polygon coordinates={points} fillColor={c.primarySoft} strokeColor={c.primary} strokeWidth={2} />}
    </MapView>
    <View style={[s.top,{backgroundColor:c.glass,borderColor:c.border}]}>
      <Field value={q} onChangeText={setQ} onSubmitEditing={()=>query.refetch()} placeholder="Search Kigali, district, bedrooms…" style={s.search}/>
      <View style={s.row}>{["RENT","SALE","SHORT_STAY"].map(x=><Chip key={x} label={x==="SHORT_STAY"?"STAY":x} active={type===x} onPress={()=>{selection();setType(x)}} />)}</View>
      <View style={s.row}><Field value={district} onChangeText={setDistrict} placeholder="District" style={s.small}/><Button title={drawing?"Finish area":"Draw area"} size="sm" variant={drawing?"accent":"primary"} onPress={()=>{selection();setDrawing(v=>!v)}} /></View>
      {drawing && <Text style={[s.hint,{color:c.text}]}>Tap the map to add boundary points. Turn off Draw area when finished.</Text>}
      {points.length>0 && <Pressable onPress={()=>{selection();setPoints([])}}><Text style={[s.clear,{color:c.primary}]}>Clear drawn area</Text></Pressable>}
      <Pressable onPress={async()=>{if(!(await isSignedIn())){router.push("/login");return;}try{await api("/saved-searches",{method:"POST",body:JSON.stringify({name:q||("Map "+type+" search"),criteria:Object.fromEntries(new URLSearchParams(params))})},true);Alert.alert("Search saved","You will keep this search on your account.");}catch(e){Alert.alert("Save search",e instanceof Error?e.message:"Unable to save search")}}}><Text style={[s.saveSearch,{color:c.primary}]}>☆ Save this search</Text></Pressable>
    </View>
    <View style={s.fab}><Button title="Search here" size="sm" variant="accent" onPress={()=>{selection();void query.refetch()}} /></View><BottomSheet ref={sheet} index={1} snapPoints={["12%","45%","90%"]} enablePanDownToClose={false} backgroundStyle={{backgroundColor:c.surface}} handleIndicatorStyle={{backgroundColor:c.border}}>
      <BottomSheetFlatList data={visible} refreshing={query.isRefetching} onRefresh={()=>void query.refetch()} keyExtractor={(x:SearchItem)=>x.listing.id} contentContainerStyle={{padding:spacing.lg,paddingBottom:120}} ListHeaderComponent={<View><Text style={[s.count,{color:c.text,fontFamily:fonts.sansBold}]}>{query.isFetching?"Updating…":visible.length+" properties"}</Text><OfflineBanner visible={query.isError && visible.length>0}/></View>} renderItem={({item}:{item:SearchItem})=><PropertyCard item={item} onPress={()=>router.push("/property/"+item.property.id)} />} ListEmptyComponent={<Text style={[s.hint,{color:c.muted}]}>No matching live listings.</Text>} />
    </BottomSheet>
  </View>;
}
const s=StyleSheet.create({root:{flex:1},map:{...StyleSheet.absoluteFillObject},top:{position:"absolute",top:55,left:12,right:12,padding:10,borderWidth:1,borderRadius:18},search:{marginBottom:2},row:{flexDirection:"row",gap:8,alignItems:"center",marginTop:6,flexWrap:"wrap"},small:{flex:1,minWidth:120},hint:{fontSize:12,lineHeight:18,marginTop:7},clear:{fontWeight:"800",marginTop:7},saveSearch:{fontWeight:"900",marginTop:9},fab:{position:"absolute",right:16,bottom:155,zIndex:20},count:{fontSize:17,marginBottom:10}});