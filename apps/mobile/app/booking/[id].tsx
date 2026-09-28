import{useLocalSearchParams,useRouter}from"expo-router";
import{useMutation,useQuery,useQueryClient}from"@tanstack/react-query";
import{ActivityIndicator,ScrollView,StyleSheet,Text,View}from"react-native";
import{api,money}from"../../src/lib/api";
import{Button}from"../../src/components/ui";
import{useTheme}from"../../src/stores/theme";
import{fonts,spacing}from"../../src/theme";

export default function BookingDetail(){
 const c=useTheme(s=>s.palette);const{id}=useLocalSearchParams<{id?:string}>();const router=useRouter();const qc=useQueryClient();
 const q=useQuery({queryKey:["booking",id],enabled:Boolean(id),queryFn:()=>api<any>("/bookings/"+id,{},true)});
 const cancel=useMutation({mutationFn:()=>api("/bookings/"+id+"/cancel",{method:"POST"},true),onSuccess:()=>qc.invalidateQueries({queryKey:["booking",id]})});
 if(q.isPending)return <View style={[s.center,{backgroundColor:c.bg}]}><ActivityIndicator color={c.primary}/></View>;
 if(q.isError||!q.data)return <View style={[s.center,{backgroundColor:c.bg}]}><Text style={{color:c.danger}}>Unable to load booking.</Text><Button title="Retry" onPress={()=>void q.refetch()}/></View>;
 const b=q.data;
 const paymentPending=["PENDING","PAYMENT_PENDING"].includes(String(b.status));
 return <ScrollView style={{backgroundColor:c.bg}} contentContainerStyle={s.pad}>
   <Text style={[s.eyebrow,{color:c.primary,fontFamily:fonts.sansBold}]}>BOOKING</Text>
   <Text style={[s.h1,{color:c.text,fontFamily:fonts.displayStrong}]}>Reservation {String(id).slice(0,8)}…</Text>
   <View style={[s.card,{backgroundColor:c.surface,borderColor:c.border}]}>
     <Text style={[s.state,{color:c.primary}]}>{b.status}</Text>
     <Text style={[s.amount,{color:c.text}]}>{money(b.amountMinor||0)} {b.currency||"RWF"}</Text>
     <Text style={{color:c.muted,marginTop:6}}>{b.startDate} → {b.endDate}</Text>
     {b.property?.title&&<Text style={{color:c.text,fontWeight:"800",marginTop:10}}>{b.property.title}</Text>}
   </View>
   {paymentPending&&<View style={[s.action,{backgroundColor:c.surface,borderColor:c.border}]}><Text style={{color:c.text,fontWeight:"800"}}>Payment pending</Text><Text style={{color:c.muted,marginTop:5}}>Continue to secure payment. Booking confirmation is controlled by the payment backend.</Text><Button title="Continue to payment" onPress={()=>router.push({pathname:"/payment",params:{bookingId:String(id)}})}/></View>}
   {["PENDING","PAYMENT_PENDING","CONFIRMED"].includes(String(b.status))&&<Button title={cancel.isPending?"Cancelling…":"Cancel booking"} variant="ghost" onPress={()=>cancel.mutate()} disabled={cancel.isPending}/>}
   {cancel.isError&&<Text style={{color:c.danger}}>{cancel.error instanceof Error?cancel.error.message:"Unable to cancel booking"}</Text>}
 </ScrollView>;
}
const s=StyleSheet.create({center:{flex:1,alignItems:"center",justifyContent:"center",gap:12,padding:20},pad:{padding:spacing.lg,paddingBottom:80,gap:12},eyebrow:{fontSize:11,letterSpacing:2},h1:{fontSize:32,marginTop:5,marginBottom:8},card:{borderWidth:1,borderRadius:20,padding:18},state:{fontWeight:"900",fontSize:13},amount:{fontSize:27,fontWeight:"900",marginTop:8},action:{borderWidth:1,borderRadius:18,padding:15,gap:7}});