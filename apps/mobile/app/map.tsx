import * as Location from "expo-location";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, View, StyleSheet, Text, Pressable } from "react-native";
import { useQuery } from "@tanstack/react-query";
import MapView, { Marker, Region } from "react-native-maps";
import { api, SearchItem } from "../src/lib/api";
import { useTheme } from "../src/stores/theme";
import { fonts } from "../src/theme";

export default function MapScreen() {
  const params = useLocalSearchParams<{ lat?: string; lng?: string }>();
  const router = useRouter();
  const c = useTheme((s) => s.palette);
  const [region, setRegion] = useState<Region | null>(null);
  useEffect(() => {
    void (async () => {
      let lat = Number(params.lat), lng = Number(params.lng);
      if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
        const permission = await Location.requestForegroundPermissionsAsync();
        if (permission.status !== "granted") { setRegion({ latitude: -1.9441, longitude: 30.0619, latitudeDelta: .08, longitudeDelta: .08 }); return; }
        const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        lat = pos.coords.latitude; lng = pos.coords.longitude;
      }
      setRegion({ latitude: lat, longitude: lng, latitudeDelta: .08, longitudeDelta: .08 });
    })();
  }, [params.lat, params.lng]);
  const query = useQuery({
    enabled: !!region,
    queryKey: ["map-search", region?.latitude, region?.longitude],
    queryFn: () => api<{ items: SearchItem[] }>("/search?lat=" + region!.latitude + "&lng=" + region!.longitude + "&radiusKm=5&limit=60"),
  });
  if (!region) return <View style={[styles.loading, { backgroundColor: c.bg }]}><ActivityIndicator color={c.primary} /></View>;
  return <View style={styles.root}><MapView style={styles.map} region={region} onRegionChangeComplete={setRegion}>
    {(query.data?.items ?? []).map((item) => <Marker key={item.listing.id} coordinate={{ latitude: item.property.latitude, longitude: item.property.longitude }} title={item.property.title} description={item.property.district} onCalloutPress={() => router.push({ pathname: "/property/[id]", params: { id: item.property.id } })} />)}
  </MapView>
  <View style={[styles.overlay, { backgroundColor: c.glass, borderColor: c.border }]}>
    <Text style={[styles.overlayKicker, { color: c.primary, fontFamily: fonts.sansBold }]}>LIVE MAP</Text>
    <Text style={[styles.overlayText, { color: c.text, fontFamily: fonts.sansBold }]}>{query.isFetching ? "Updating nearby listings…" : (query.data?.items.length ?? 0) + " nearby properties"}</Text>
  </View>
  {query.isError && <Pressable onPress={() => void query.refetch()} style={[styles.retry, { backgroundColor: c.surface, borderColor: c.border }]}><Text style={{ color: c.primary, fontWeight: "800" }}>Retry map search</Text></Pressable>}
  </View>;
}
const styles=StyleSheet.create({root:{flex:1},loading:{flex:1,alignItems:"center",justifyContent:"center"},map:{flex:1},overlay:{position:"absolute",top:56,left:16,right:16,padding:14,borderRadius:18,borderWidth:1,gap:4},overlayKicker:{fontSize:10,letterSpacing:1.4,textAlign:"center"},overlayText:{textAlign:"center",fontSize:14},retry:{position:"absolute",bottom:40,alignSelf:"center",padding:12,borderRadius:14,borderWidth:1}});