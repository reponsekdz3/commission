import { router, useLocalSearchParams } from "expo-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Alert, Modal, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import MapView, { Marker } from "react-native-maps";
import { api, money } from "../../src/lib/api";
import { requestId } from "../../src/lib/ids";
import { Gallery, BookingBar } from "../../src/components/property";
import { Button, Chip, Input } from "../../src/components/ui";
import { isSignedIn } from "../../src/lib/session";
import { useTheme } from "../../src/stores/theme";
import { fonts, spacing } from "../../src/theme";
import { selection } from "../../src/lib/haptics";


function PropertyVideo({url}:{url:string}){
 const player=useVideoPlayer(url,p=>{p.loop=false});
 return <VideoView player={player} nativeControls style={{width:"100%",height:240,borderRadius:18,marginTop:12,backgroundColor:"#111"}} />;
}
export default function Property(){
  const { id } = useLocalSearchParams<{id?:string}>();
  const c = useTheme(s=>s.palette);
  const qc = useQueryClient();
  const [offer,setOffer]=useState("");
  const [showViewing,setShowViewing]=useState(false);
  const [error,setError]=useState("");

  const q=useQuery({
    queryKey:["property",id],
    enabled:Boolean(id),
    queryFn:()=>api<any>("/properties/"+id)
  });
  const p=q.data;
  const l=p?.listings?.[0];
  const media=useMemo(()=>((p?.media||[]).filter((m:any)=>m.url).map((m:any)=>m.url)),[p]);

  const fav=useQuery({
    queryKey:["favorite-state",id],
    enabled:Boolean(id),
    queryFn:async()=>{
      const rows=await api<any[]>("/favorites",{},true);
      return rows.some((x:any)=>String(x.propertyId||x.id)===String(id));
    }
  });
  const save=useMutation({
    mutationFn:async()=>{
      if(!id)throw new Error("Property is missing");
      return fav.data?api("/favorites/"+id,{method:"DELETE"},true):api("/favorites/"+id,{method:"POST"},true);
    },
    onSuccess:()=>qc.invalidateQueries({queryKey:["favorite-state",id]})
  });
  const slots=useQuery({
    queryKey:["viewing-slots",l?.id],
    enabled:showViewing&&Boolean(l?.id),
    queryFn:()=>api<any[]>("/viewings/slots/"+l.id)
  });
  const offerMutation=useMutation({
    mutationFn:async()=>{
      if(!l)throw new Error("Listing unavailable");
      return api("/offers",{method:"POST",body:JSON.stringify({listingId:l.id,amountMinor:Number(offer),currency:l.currency||"RWF"})},true);
    },
    onSuccess:()=>{
      setOffer("");
      Alert.alert("Offer sent","The seller can now accept, reject or counter it.");
    }
  });

  async function auth(){
    if(!(await isSignedIn())){router.push("/login");return false;}
    return true;
  }
  async function chat(){
    if(!await auth())return;
    try{
      await api("/messages",{method:"POST",body:JSON.stringify({propertyId:p.id,recipientId:p.ownerId,body:"I am interested in this property. When can we view it?"})},true);
      router.push({pathname:"/chat/[threadId]",params:{threadId:"property-"+p.id}});
    }catch(e){Alert.alert("Message",e instanceof Error?e.message:"Unable to start conversation");}
  }
  async function requestViewing(slotStart:string){
    if(!await auth())return;
    try{
      await api("/viewings",{method:"POST",body:JSON.stringify({listingId:l.id,slotStart})},true);
      setShowViewing(false);
      Alert.alert("Viewing requested","Your selected slot is now with the owner or agent.");
    }catch(e){Alert.alert("Viewing",e instanceof Error?e.message:"Unable to request viewing");}
  }

  if(q.isPending)return <View style={[s.center,{backgroundColor:c.bg}]}><Text style={{color:c.muted}}>Loading property…</Text></View>;
  if(q.isError||!p)return <View style={[s.center,{backgroundColor:c.bg}]}><Text style={{color:c.danger}}>Unable to load this property.</Text><Button title="Retry" onPress={()=>void q.refetch()}/></View>;

  return <View style={{flex:1,backgroundColor:c.bg}}>
    <ScrollView contentContainerStyle={{paddingBottom:l?120:40}}>
      <View style={s.top}>
        <Pressable accessibilityRole="button" onPress={()=>router.back()} style={[s.circle,{backgroundColor:c.glass,borderColor:c.border}]}><Text style={{color:c.text,fontSize:20}}>‹</Text></Pressable>
        <Pressable accessibilityRole="button" onPress={()=>{selection();save.mutate()}} disabled={save.isPending} style={[s.circle,{backgroundColor:c.glass,borderColor:c.border}]}><Text style={{fontSize:20,color:fav.data?c.accent:c.text}}>{fav.data?"♥":"♡"}</Text></Pressable>
      </View>

      {media.length?<Gallery urls={media}/>:<View style={[s.noMedia,{backgroundColor:c.surface3}]}><Text style={{color:c.muted}}>Media is still processing.</Text></View>}

      <View style={s.pad}>
        <View style={s.badges}><Chip label={p.verificationStatus==="VERIFIED"?"VERIFIED":"LISTED"} active={p.verificationStatus==="VERIFIED"}/><Chip label={p.propertyType||"PROPERTY"}/></View>
        <Text style={[s.title,{color:c.text,fontFamily:fonts.displayStrong}]}>{p.title}</Text>
        <Text style={[s.meta,{color:c.muted}]}>{[p.village,p.cell,p.sector,p.district,p.province].filter(Boolean).join(" · ")}</Text>
        <Text style={[s.price,{color:c.text}]}>{l?money(l.priceMinor):"Price on request"}{l?.listingType==="RENT"&&<Text style={{fontSize:14,color:c.muted}}> / month</Text>}</Text>
        <View style={s.stats}>{[["Beds",p.bedrooms],["Baths",p.bathrooms],["Parking",p.parking],["Area",(p.areaValue??"—")+" "+(p.areaUnit||"")]].map(([k,v])=><View key={String(k)} style={[s.stat,{backgroundColor:c.surface,borderColor:c.border}]}><Text style={{color:c.muted,fontSize:12}}>{k}</Text><Text style={{color:c.text,fontWeight:"900",marginTop:4}}>{String(v??"—")}</Text></View>)}</View>

        <Text style={[s.heading,{color:c.text}]}>Amenities</Text>
        <View style={s.chips}>{(p.amenities||[]).map((x:string)=><Chip key={x} label={x}/>)}</View>

        <Text style={[s.heading,{color:c.text}]}>Overview</Text>
        <Text style={[s.body,{color:c.muted}]}>{p.description}</Text>

        {p.latitude&&p.longitude&&<><Text style={[s.heading,{color:c.text}]}>Location</Text><MapView style={s.map} initialRegion={{latitude:Number(p.latitude),longitude:Number(p.longitude),latitudeDelta:.02,longitudeDelta:.02}}><Marker coordinate={{latitude:Number(p.latitude),longitude:Number(p.longitude)}} title={p.title}/></MapView></>}

        {l&&<View style={[s.actions,{backgroundColor:c.surface,borderColor:c.border}]}>
          <View style={{flexDirection:"row",gap:8}}>
            <Button title="Request viewing" variant="accent" size="sm" onPress={()=>{selection();setShowViewing(true)}}/>
            <Button title="Message owner" variant="ghost" size="sm" onPress={()=>void chat()}/>
          </View>
          {l.listingType==="SALE"&&<View style={{marginTop:12}}>
            <Input label="Offer amount (RWF minor units)" value={offer} onChangeText={v=>setOffer(v.replace(/\D/g,""))} keyboardType="number-pad"/>
            <Button title={offerMutation.isPending?"Sending…":"Submit offer"} onPress={()=>offerMutation.mutate()} disabled={!offer||offerMutation.isPending}/>
            {offerMutation.isError&&<Text style={{color:c.danger,marginTop:7}}>{offerMutation.error instanceof Error?offerMutation.error.message:"Offer failed"}</Text>}
          </View>}
        </View>}

        {!!error&&<Text style={{color:c.danger}}>{error}</Text>}
      </View>
    </ScrollView>

    {l&&<BookingBar price={money(l.priceMinor)+(l.listingType==="RENT"?"/mo":"")} onBook={()=>router.push({pathname:"/booking",params:{listingId:l.id}})}/>}

    <Modal visible={showViewing} transparent animationType="slide" onRequestClose={()=>setShowViewing(false)}>
      <View style={[s.modal,{backgroundColor:c.scrim}]}>
        <View style={[s.sheet,{backgroundColor:c.surface}]}>
          <Text style={[s.heading,{color:c.text,marginTop:0}]}>Choose a viewing slot</Text>
          {slots.isPending&&<Text style={{color:c.muted}}>Loading available slots…</Text>}
          {slots.data?.map((slot:any)=><Pressable key={String(slot.slotStart||slot.id)} onPress={()=>void requestViewing(slot.slotStart)} style={[s.slot,{borderColor:c.border,backgroundColor:c.surface2}]}><Text style={{color:c.text,fontWeight:"800"}}>{new Date(slot.slotStart).toLocaleString()}</Text><Text style={{color:c.muted}}>Request this slot →</Text></Pressable>)}
          {!slots.isPending&&!slots.data?.length&&<Text style={{color:c.muted}}>No available viewing slots are currently published.</Text>}
          <Button title="Close" variant="ghost" onPress={()=>setShowViewing(false)}/>
        </View>
      </View>
    </Modal>
  </View>;
}

const s=StyleSheet.create({
  center:{flex:1,alignItems:"center",justifyContent:"center",gap:12,padding:20},
  top:{position:"absolute",top:58,left:14,right:14,zIndex:4,flexDirection:"row",justifyContent:"space-between"},
  circle:{width:44,height:44,borderWidth:1,borderRadius:22,alignItems:"center",justifyContent:"center"},
  pad:{padding:spacing.lg},
  badges:{flexDirection:"row",flexWrap:"wrap",gap:7,marginTop:10},
  title:{fontSize:32,marginTop:10},
  meta:{fontSize:13,lineHeight:20,marginTop:5},
  price:{fontSize:25,fontWeight:"900",marginTop:14},
  stats:{flexDirection:"row",gap:8,marginTop:14},
  stat:{flex:1,borderWidth:1,borderRadius:14,padding:10},
  chips:{flexDirection:"row",flexWrap:"wrap",gap:7,marginTop:8},
  heading:{fontSize:20,fontWeight:"900",marginTop:24},
  body:{fontSize:15,lineHeight:24,marginTop:8},
  map:{height:230,borderRadius:18,marginTop:10},
  actions:{borderWidth:1,borderRadius:18,padding:14,marginTop:20},
  slot:{borderWidth:1,borderRadius:14,padding:13,marginTop:8,gap:3},
  noMedia:{height:270,alignItems:"center",justifyContent:"center"},
  modal:{flex:1,justifyContent:"flex-end"},
  sheet:{padding:20,borderTopLeftRadius:28,borderTopRightRadius:28,paddingBottom:34}
});