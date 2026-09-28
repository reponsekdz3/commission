import{useEffect,useState}from"react";
import{Alert,Pressable,StyleSheet,Text,View}from"react-native";
import*as LocalAuthentication from"expo-local-authentication";
import*as SecureStore from"expo-secure-store";
import{useTheme}from"../../src/stores/theme";
import{fonts,spacing}from"../../src/theme";
import{Button}from"../../src/components/ui";

export default function Security(){
 const c=useTheme(s=>s.palette);const[enabled,setEnabled]=useState(false);const[busy,setBusy]=useState(true);
 useEffect(()=>{SecureStore.getItemAsync("imizi.biometricUnlock").then(v=>setEnabled(v==="enabled")).finally(()=>setBusy(false))},[]);
 async function toggle(){
  try{
   const has=await LocalAuthentication.hasHardwareAsync(),enrolled=await LocalAuthentication.isEnrolledAsync();
   if(!has||!enrolled){Alert.alert("Biometrics unavailable","Enroll Face ID, Touch ID or Android biometrics first.");return;}
   if(!enabled){
    const r=await LocalAuthentication.authenticateAsync({promptMessage:"Enable Imizi biometric unlock",cancelLabel:"Cancel",disableDeviceFallback:false});
    if(!r.success)return;
    await SecureStore.setItemAsync("imizi.biometricUnlock","enabled");setEnabled(true);
   }else{
    await SecureStore.deleteItemAsync("imizi.biometricUnlock");setEnabled(false);
   }
  }catch{Alert.alert("Security","Unable to update biometric unlock.")}
 }
 return <View style={[s.root,{backgroundColor:c.bg}]}>
   <Text style={[s.eyebrow,{color:c.primary,fontFamily:fonts.sansBold}]}>ACCOUNT SECURITY</Text>
   <Text style={[s.h1,{color:c.text,fontFamily:fonts.displayStrong}]}>Protect your session</Text>
   <Text style={[s.lead,{color:c.muted}]}>When biometric unlock is enabled, Imizi requires the device's secure biometric check before opening the authenticated mobile session.</Text>
   <View style={[s.card,{backgroundColor:c.surface,borderColor:c.border}]}>
     <View style={s.row}><View style={{flex:1}}><Text style={{color:c.text,fontWeight:"900",fontSize:16}}>Biometric unlock</Text><Text style={{color:c.muted,marginTop:5}}>{enabled?"Enabled on this device":"Disabled"}</Text></View><Text style={{color:enabled?c.success:c.muted,fontWeight:"900"}}>{busy?"…":enabled?"ON":"OFF"}</Text></View>
     <Button title={enabled?"Disable biometric unlock":"Enable biometric unlock"} variant={enabled?"ghost":"primary"} onPress={()=>void toggle()} disabled={busy}/>
   </View>
 </View>
}
const s=StyleSheet.create({root:{flex:1,padding:spacing.lg,gap:13},eyebrow:{fontSize:11,letterSpacing:2},h1:{fontSize:32,marginTop:5},lead:{fontSize:14,lineHeight:21},card:{borderWidth:1,borderRadius:18,padding:16,gap:14},row:{flexDirection:"row",alignItems:"center"}});