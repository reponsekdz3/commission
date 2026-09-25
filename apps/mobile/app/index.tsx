
import * as Location from "expo-location";
import { getAccessToken } from "../src/lib/auth";
import { registerPushToken } from "../src/lib/notifications";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, Pressable, SafeAreaView, StyleSheet, Text, TextInput, View } from "react-native";

export default function Home() {
  const router=useRouter();
  const [q,setQ]=useState("");
  const [location,setLocation]=useState("");
  const [checking,setChecking]=useState(true);

  useEffect(()=>{
    getAccessToken().then(token=>{if(token)void registerPushToken();});
    Location.requestForegroundPermissionsAsync().then(permission=>{
      if(permission.status==="granted") {
        return Location.getCurrentPositionAsync({accuracy:Location.Accuracy.Balanced})
          .then(({coords})=>setLocation(coords.latitude.toFixed(3)+", "+coords.longitude.toFixed(3)));
      }
    }).catch(()=>{}).finally(()=>setChecking(false));
  },[]);

  return <SafeAreaView style={styles.safe}><View style={styles.wrap}>
    <Text style={styles.kicker}>RWANDA-FIRST REAL ESTATE</Text>
    <Text style={styles.hero}>Find your next place.</Text>
    <Text style={styles.sub}>Rent, buy, book viewings, chat with owners and manage rentals from one platform.</Text>
    <View style={styles.search}>
      <TextInput value={q} onChangeText={setQ} placeholder="3 bedroom near Kicukiro..." style={styles.input}
        onSubmitEditing={()=>router.push({pathname:"/search",params:{q}})} />
      <Pressable style={styles.searchBtn} onPress={()=>router.push({pathname:"/search",params:{q}})}>
        <Text style={styles.searchBtnText}>Search</Text>
      </Pressable>
    </View>
    <View style={styles.actions}>
      <Pressable style={styles.action} onPress={()=>router.push("/map")}>
        <Text style={styles.actionTitle}>Nearby map</Text>
        <Text style={styles.actionText}>{checking?"Getting location...":location||"Choose area"}</Text>
      </Pressable>
      <Pressable style={styles.action} onPress={()=>router.push("/messages")}>
        <Text style={styles.actionTitle}>Messages</Text>
        <Text style={styles.actionText}>Chat with owners and agents</Text>
      </Pressable>
    </View>
    <Pressable style={styles.login} onPress={()=>router.push("/login")}><Text style={styles.loginText}>Sign in to book, save and manage</Text></Pressable>
    {checking&&<ActivityIndicator style={{marginTop:24}}/>}
  </View></SafeAreaView>;
}

const styles=StyleSheet.create({
  safe:{flex:1,backgroundColor:"#f7f3eb"},wrap:{padding:22,gap:14},
  kicker:{fontSize:11,fontWeight:"800",letterSpacing:2,color:"#21583f",marginTop:14},
  hero:{fontSize:44,fontWeight:"900",lineHeight:46,color:"#171717"},
  sub:{fontSize:16,color:"#5d5a54",lineHeight:24},
  search:{backgroundColor:"#fff",borderRadius:18,padding:8,borderWidth:1,borderColor:"#e8e1d7"},
  input:{padding:12,fontSize:16},searchBtn:{backgroundColor:"#21583f",padding:14,borderRadius:12,alignItems:"center"},
  searchBtnText:{color:"#fff"},actions:{flexDirection:"row",gap:12},
  action:{flex:1,backgroundColor:"#fff",padding:16,borderRadius:18,borderWidth:1,borderColor:"#e8e1d7"},
  actionTitle:{fontWeight:"900",fontSize:16},actionText:{color:"#6a6a6a",marginTop:8,lineHeight:19},
  login:{padding:16,borderRadius:16,backgroundColor:"#e7efe9",alignItems:"center"},loginText:{color:"#21583f",fontWeight:"900"}
});
