import { router, useLocalSearchParams } from "expo-router";
import * as Linking from "expo-linking";
import { useEffect, useMemo, useState } from "react";
import { Alert, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from "react-native";
import { useQueryClient } from "@tanstack/react-query";
import { api, money } from "../src/lib/api";
import { requestId } from "../src/lib/ids";
import { Button, Input } from "../src/components/ui";
import { MethodTile, SuccessOverlay } from "../src/components/payment";
import { useTheme } from "../src/stores/theme";
import { fonts, spacing } from "../src/theme";

export default function Payment(){
  const c=useTheme(s=>s.palette);
  const {bookingId}=useLocalSearchParams<{bookingId?:string}>();
  const [provider,setProvider]=useState("MTN_MOMO");
  const [msisdn,setMsisdn]=useState("");
  const [busy,setBusy]=useState(false);
  const [intent,setIntent]=useState<any>();
  const [status,setStatus]=useState("READY");
  const [error,setError]=useState("");
  const [success,setSuccess]=useState(false);
  const qc=useQueryClient();

  const ready=useMemo(()=>Boolean(bookingId&&((provider!=="MTN_MOMO")||msisdn.replace(/\D/g,"").length>=8)),[bookingId,provider,msisdn]);

  useEffect(()=>{
    if(!intent?.id||intent.status==="SUCCEEDED"||intent.status==="FAILED")return;
    const timer=setInterval(async()=>{
      try{
        const next=await api<any>("/payments/"+intent.id+"/status",{method:"POST"},true);
        setStatus(next.status||"PENDING_PROVIDER");
        if(next.status==="SUCCEEDED"){clearInterval(timer);setSuccess(true);setStatus("SUCCEEDED");await qc.invalidateQueries({queryKey:["booking",bookingId]});}
        if(next.status==="FAILED"||next.status==="EXPIRED")clearInterval(timer);
      }catch{}
    },2500);
    return()=>clearInterval(timer);
  },[intent?.id,intent?.status,bookingId,qc]);

  async function submit(){
    if(!bookingId){setError("Booking is missing.");return;}
    if(!ready){setError("Enter a valid MTN MoMo number.");return;}
    setBusy(true);setError("");
    try{
      const created=await api<any>("/payments/intents",{method:"POST",body:JSON.stringify({bookingId,provider,msisdn:msisdn||undefined,idempotencyKey:requestId("pay")})},true);
      setIntent(created);setStatus(created.status||"PENDING_PROVIDER");
      if(created.checkoutUrl)await Linking.openURL(created.checkoutUrl);
      if(created.status==="SUCCEEDED"){setSuccess(true);setStatus("SUCCEEDED");}
    }catch(e){setError(e instanceof Error?e.message:"Unable to initiate payment");}
    finally{setBusy(false);}
  }

  if(success)return <SuccessOverlay title="Payment confirmed" subtitle="Your payment has been confirmed by the backend." onDone={()=>{setSuccess(false);router.replace({pathname:"/booking/[id]",params:{id:String(bookingId)}})}}/>;

  return <SafeAreaView style={[s.root,{backgroundColor:c.bg}]}><ScrollView contentContainerStyle={s.pad}>
    <Text style={[s.eyebrow,{color:c.primary,fontFamily:fonts.sansBold}]}>SECURE CHECKOUT</Text>
    <Text style={[s.title,{color:c.text,fontFamily:fonts.displayStrong}]}>Complete payment</Text>
    <Text style={[s.muted,{color:c.muted}]}>The payment provider confirms success on the server. The mobile app never trusts a client-side success signal.</Text>

    <View style={s.section}>
      <Text style={[s.heading,{color:c.text,fontFamily:fonts.sansBold}]}>Choose payment method</Text>
      <MethodTile name="MTN MoMo" logo="📱" selected={provider==="MTN_MOMO"} onPress={()=>setProvider("MTN_MOMO")}/>
      <MethodTile name="Flutterwave checkout" logo="🌐" selected={provider==="FLUTTERWAVE"} onPress={()=>setProvider("FLUTTERWAVE")}/>
      <MethodTile name="Card checkout" logo="💳" selected={provider==="CARD"} onPress={()=>setProvider("CARD")}/>
    </View>

    {provider==="MTN_MOMO"&&<Input label="MTN MoMo number" value={msisdn} onChangeText={setMsisdn} keyboardType="phone-pad" placeholder="+250 7xx xxx xxx" helper="Use the number that will approve the RequestToPay prompt."/>}
    {provider!=="MTN_MOMO"&&<View style={[s.info,{backgroundColor:c.primarySoft,borderColor:c.border}]}><Text style={{color:c.text,fontWeight:"800"}}>Secure hosted checkout</Text><Text style={{color:c.muted,marginTop:4}}>You will be sent to the configured payment provider. The server verifies the resulting transaction.</Text></View>}

    {intent&&<View style={[s.status,{backgroundColor:c.surface,borderColor:c.border}]}>
      <Text style={{color:c.muted}}>Status</Text><Text style={{color:c.text,fontWeight:"900",fontSize:22,marginTop:4}}>{status}</Text>
      {intent.amountMinor&&<Text style={{color:c.muted,marginTop:6}}>Amount {money(intent.amountMinor)}</Text>}
      {intent.checkoutUrl&&<Pressable onPress={()=>void Linking.openURL(intent.checkoutUrl)}><Text style={{color:c.primary,fontWeight:"900",marginTop:10}}>Open secure checkout →</Text></Pressable>}
    </View>}

    {!!error&&<Text style={[s.error,{color:c.danger,backgroundColor:c.dangerSoft}]}>{error}</Text>}
    <Button title={busy?"Starting secure payment…":"Continue with payment"} onPress={()=>void submit()} loading={busy} disabled={busy||!ready}/>
  </ScrollView></SafeAreaView>;
}
const s=StyleSheet.create({
 root:{flex:1},pad:{padding:spacing.lg,paddingBottom:50,gap:14},eyebrow:{fontSize:11,letterSpacing:2},title:{fontSize:34,marginTop:6},muted:{fontSize:14,lineHeight:21},section:{marginTop:8},heading:{fontSize:18,marginBottom:10},info:{borderWidth:1,borderRadius:16,padding:14},status:{borderWidth:1,borderRadius:16,padding:16},error:{padding:12,borderRadius:12,fontWeight:"700"}
});