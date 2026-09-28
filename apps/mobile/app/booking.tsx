import{useLocalSearchParams,useRouter}from"expo-router";
import{useState}from"react";
import{Alert,SafeAreaView,ScrollView,StyleSheet,Text,View}from"react-native";
import{api,money}from"../src/lib/api";
import{requestId}from"../src/lib/ids";
import{Button,Input}from"../src/components/ui";
import{useTheme}from"../src/stores/theme";
import{fonts,spacing}from"../src/theme";
import{useQuery}from"@tanstack/react-query";

function addMonths(date:Date,n:number){const copy=new Date(date);copy.setMonth(copy.getMonth()+n);return copy.toISOString().slice(0,10)}
export default function Booking(){
 const c=useTheme(s=>s.palette);const{listingId}=useLocalSearchParams<{listingId?:string}>();const router=useRouter();
 const today=new Date(),[startDate,setStartDate]=useState(today.toISOString().slice(0,10)),[endDate,setEndDate]=useState(addMonths(today,1)),[guests,setGuests]=useState("1"),[busy,setBusy]=useState(false),[error,setError]=useState("");
 const quote=useQuery({queryKey:["booking-quote",listingId,startDate,endDate],enabled:Boolean(listingId&&startDate&&endDate),queryFn:()=>api<any>("/bookings/quote",{method:"POST",body:JSON.stringify({listingId,startDate,endDate})})});
 async function submit(){
   if(!listingId){setError("Listing is missing.");return;}
   if(new Date(endDate)<=new Date(startDate)){setError("End date must be after start date.");return;}
   setBusy(true);setError("");
   try{
     const b=await api<any>("/bookings",{method:"POST",body:JSON.stringify({listingId,startDate,endDate,guests:Number(guests)||1,idempotencyKey:requestId("booking")})},true);
     const booking=b.booking||b;if(!booking.id)throw new Error(b.message||"Unable to create booking");
     router.push({pathname:"/payment",params:{bookingId:String(booking.id)}});
   }catch(e){setError(e instanceof Error?e.message:"Unable to create booking")}finally{setBusy(false)}
 }
 return <SafeAreaView style={[s.safe,{backgroundColor:c.bg}]}><ScrollView contentContainerStyle={s.wrap}>
   <Text style={[s.eyebrow,{color:c.primary,fontFamily:fonts.sansBold}]}>RESERVATION</Text>
   <Text style={[s.title,{color:c.text,fontFamily:fonts.displayStrong}]}>Reserve property</Text>
   <Text style={[s.muted,{color:c.muted}]}>Availability and final booking state are validated by the production API. Payment is handled separately so a provider redirect or approval cannot create a false booking success.</Text>
   <Input label="Start date" value={startDate} onChangeText={setStartDate} placeholder="YYYY-MM-DD"/>
   <Input label="End date" value={endDate} onChangeText={setEndDate} placeholder="YYYY-MM-DD"/>
   <Input label="Guests" value={guests} onChangeText={v=>setGuests(v.replace(/\D/g,""))} keyboardType="number-pad"/>
   {quote.data&&<View style={[s.quote,{backgroundColor:c.surface,borderColor:c.border}]}><Text style={{color:c.muted}}>Estimated total</Text><Text style={[s.total,{color:c.text}]}>{money(quote.data.total?.amountMinor??quote.data.amountMinor??0)}</Text><Text style={{color:c.muted}}>Availability quote is refreshed whenever the dates change.</Text></View>}
   {quote.isError&&<Text style={[s.error,{color:c.danger}]}>{quote.error instanceof Error?quote.error.message:"Unable to quote availability"}</Text>}
   {!!error&&<Text style={[s.error,{color:c.danger,backgroundColor:c.dangerSoft}]}>{error}</Text>}
   <Button title={busy?"Creating booking…":"Reserve and continue to payment"} onPress={()=>void submit()} loading={busy} disabled={busy||!quote.data}/>
 </ScrollView></SafeAreaView>;
}
const s=StyleSheet.create({safe:{flex:1},wrap:{padding:spacing.lg,gap:13,paddingBottom:60},eyebrow:{fontSize:11,letterSpacing:2},title:{fontSize:34,marginTop:5},muted:{fontSize:14,lineHeight:21},quote:{borderWidth:1,borderRadius:16,padding:16,marginTop:5,gap:4},total:{fontSize:28,fontWeight:"900",marginTop:3},error:{padding:11,borderRadius:10,fontWeight:"700"}});