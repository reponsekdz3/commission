
import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import { Alert, Pressable, SafeAreaView, StyleSheet, Text, TextInput, View } from "react-native";
import { api } from "../src/lib/api";

function addMonths(date:Date,n:number){const copy=new Date(date);copy.setMonth(copy.getMonth()+n);return copy.toISOString().slice(0,10);}

export default function Booking(){
  const {listingId}=useLocalSearchParams<{listingId:string}>();
  const router=useRouter();
  const today=new Date();
  const [startDate,setStartDate]=useState(today.toISOString().slice(0,10));
  const [endDate,setEndDate]=useState(addMonths(today,1));
  const [busy,setBusy]=useState(false);

  async function submit(){
    if(!listingId)return;
    setBusy(true);
    try{
      const quote=await api<{amountMinor:number;currency:string}>(
        "/bookings/quote?listingId="+encodeURIComponent(listingId)+"&startDate="+startDate+"&endDate="+endDate,
        {auth:false}
      );
      await api("/bookings",{
        method:"POST",
        body:JSON.stringify({listingId,startDate,endDate,guests:1,idempotencyKey:"mobile-"+Date.now()+"-"+Math.random().toString(36).slice(2,10)})
      });
      Alert.alert("Booking created","Payment is now required to confirm this booking. Total: "+new Intl.NumberFormat("en-RW",{maximumFractionDigits:0}).format(quote.amountMinor)+" "+quote.currency,[{text:"Done",onPress:()=>router.replace("/")}]);
    }catch(e){Alert.alert("Booking failed",e instanceof Error?e.message:"Unable to create booking");}
    finally{setBusy(false);}
  }

  return <SafeAreaView style={styles.safe}><View style={styles.wrap}>
    <Text style={styles.title}>Reserve property</Text>
    <Text style={styles.muted}>Choose rental dates. Availability is checked on the server.</Text>
    <Text style={styles.label}>Start date</Text><TextInput value={startDate} onChangeText={setStartDate} style={styles.input}/>
    <Text style={styles.label}>End date</Text><TextInput value={endDate} onChangeText={setEndDate} style={styles.input}/>
    <Pressable style={styles.button} disabled={busy} onPress={submit}><Text style={styles.buttonText}>{busy?"Checking...":"Create booking"}</Text></Pressable>
  </View></SafeAreaView>;
}
const styles=StyleSheet.create({safe:{flex:1,backgroundColor:"#f7f3eb"},wrap:{padding:22,gap:12},title:{fontSize:32,fontWeight:"900"},muted:{color:"#65615b",lineHeight:21},label:{fontWeight:"800",marginTop:8},input:{backgroundColor:"#fff",borderRadius:14,padding:15,borderWidth:1,borderColor:"#e7e2da",fontSize:16},button:{backgroundColor:"#21583f",padding:16,borderRadius:14,alignItems:"center",marginTop:10},buttonText:{color:"#fff",fontWeight:"900",fontSize:16}});
