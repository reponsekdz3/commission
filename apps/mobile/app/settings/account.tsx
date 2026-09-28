import{useEffect,useState}from"react";
import{Alert,ScrollView,Share,StyleSheet,Text,View}from"react-native";
import{router}from"expo-router";
import{api}from"../../src/lib/api";
import{user,clearSession}from"../../src/lib/session";
import{Button,Input}from"../../src/components/ui";
import{useTheme}from"../../src/stores/theme";
import{fonts,spacing}from"../../src/theme";

export default function AccountSettings(){
 const c=useTheme(s=>s.palette);const[u,setU]=useState<any>();const[fullName,setFullName]=useState("");const[locale,setLocale]=useState("rw");const[busy,setBusy]=useState(false);
 useEffect(()=>{user().then(x=>{setU(x);setFullName(x?.fullName||"");setLocale(x?.locale||"rw")})},[]);
 async function save(){setBusy(true);try{const next=await api<any>("/users/me",{method:"PATCH",body:JSON.stringify({fullName,locale})},true);setU(next);Alert.alert("Saved","Your profile was updated on the backend.");}catch(e){Alert.alert("Profile",e instanceof Error?e.message:"Unable to update profile")}finally{setBusy(false)}}
 async function exportData(){try{const d=await api<any>("/privacy/export",{},true);await Share.share({message:JSON.stringify(d,null,2),title:"Imizi personal data export"});}catch(e){Alert.alert("Privacy export",e instanceof Error?e.message:"Unable to export your data")}}
 function deleteAccount(){Alert.alert("Delete account","This permanently removes your account and personal data according to the backend deletion workflow.",[{text:"Cancel",style:"cancel"},{text:"Delete permanently",style:"destructive",onPress:async()=>{try{await api("/privacy/delete",{method:"POST"},true);await clearSession();router.replace("/login")}catch(e){Alert.alert("Delete account",e instanceof Error?e.message:"Unable to delete account")}}}])}
 return <ScrollView style={[s.root,{backgroundColor:c.bg}]} contentContainerStyle={s.pad}>
  <Text style={[s.eyebrow,{color:c.primary,fontFamily:fonts.sansBold}]}>ACCOUNT</Text><Text style={[s.h1,{color:c.text,fontFamily:fonts.displayStrong}]}>Profile & privacy</Text>
  {u&&<View style={[s.card,{backgroundColor:c.surface,borderColor:c.border}]}>
   <Input label="Full name" value={fullName} onChangeText={setFullName}/>
   <Input label="Locale" value={locale} onChangeText={setLocale} helper="rw · en · fr"/>
   <Text style={{color:c.muted}}>Email: {u.email}</Text><Text style={{color:c.muted}}>Phone: {u.phone}</Text>
   <Button title={busy?"Saving…":"Save profile"} onPress={()=>void save()} disabled={busy}/>
  </View>}
  <View style={[s.card,{backgroundColor:c.surface,borderColor:c.border}]}>
   <Text style={[s.section,{color:c.text}]}>Your data</Text><Text style={{color:c.muted,lineHeight:20}}>Export your account data from the production privacy endpoint or permanently request account deletion.</Text>
   <Button title="Export my data" variant="ghost" onPress={()=>void exportData()}/>
   <Button title="Delete account" variant="danger" onPress={deleteAccount}/>
  </View>
 </ScrollView>
}
const s=StyleSheet.create({root:{flex:1},pad:{padding:spacing.lg,paddingBottom:70,gap:13},eyebrow:{fontSize:11,letterSpacing:2},h1:{fontSize:32,marginTop:5},card:{borderWidth:1,borderRadius:18,padding:16,gap:12},section:{fontSize:18,fontWeight:"900"}});