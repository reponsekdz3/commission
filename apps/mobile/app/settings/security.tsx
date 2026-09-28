import{useEffect,useState}from"react";
import{Alert,ScrollView,StyleSheet,Text,View}from"react-native";
import*as LocalAuthentication from"expo-local-authentication";
import*as SecureStore from"expo-secure-store";
import{api}from"../../src/lib/api";
import{useTheme}from"../../src/stores/theme";
import{fonts,spacing}from"../../src/theme";
import{Button,Input}from"../../src/components/ui";

export default function Security(){
 const c=useTheme(s=>s.palette);const[enabled,setEnabled]=useState(false);const[busy,setBusy]=useState(true);const[mfa,setMfa]=useState<any>();const[code,setCode]=useState("");const[reauthCode,setReauthCode]=useState("");const[sessions,setSessions]=useState<any[]>([]);const[loadingMfa,setLoadingMfa]=useState(false);
 async function load(){try{setEnabled(await SecureStore.getItemAsync("imizi.biometricUnlock")==="enabled");const ss=await api<any[]>("/auth/sessions",{},true);setSessions(ss||[])}catch{}finally{setBusy(false)}}
 useEffect(()=>{void load()},[]);
 async function toggle(){
  try{const has=await LocalAuthentication.hasHardwareAsync(),enrolled=await LocalAuthentication.isEnrolledAsync();if(!has||!enrolled){Alert.alert("Biometrics unavailable","Enroll Face ID, Touch ID or Android biometrics first.");return;}if(!enabled){const r=await LocalAuthentication.authenticateAsync({promptMessage:"Enable Imizi biometric unlock",cancelLabel:"Cancel",disableDeviceFallback:false});if(!r.success)return;await SecureStore.setItemAsync("imizi.biometricUnlock","enabled");setEnabled(true)}else{await SecureStore.deleteItemAsync("imizi.biometricUnlock");setEnabled(false)}}catch{Alert.alert("Security","Unable to update biometric unlock.")}
 }
 async function setupMfa(){setLoadingMfa(true);try{setMfa(await api<any>("/auth/mfa/setup",{method:"POST"},true))}catch(e){Alert.alert("MFA",e instanceof Error?e.message:"Unable to start MFA setup")}finally{setLoadingMfa(false)}}
 async function enableMfa(){try{await api("/auth/mfa/enable",{method:"POST",body:JSON.stringify({code})},true);Alert.alert("MFA enabled","Multi-factor authentication is now required for future logins.");setMfa(undefined);setCode("")}catch(e){Alert.alert("MFA",e instanceof Error?e.message:"Invalid MFA code")}}
 async function revoke(id:string){try{await api("/auth/sessions/"+id,{method:"DELETE"},true);setSessions(v=>v.filter(x=>x.id!==id))}catch(e){Alert.alert("Session",e instanceof Error?e.message:"Unable to revoke session")}}
 return <ScrollView style={[s.root,{backgroundColor:c.bg}]} contentContainerStyle={s.pad}>
   <Text style={[s.eyebrow,{color:c.primary,fontFamily:fonts.sansBold}]}>ACCOUNT SECURITY</Text>
   <Text style={[s.h1,{color:c.text,fontFamily:fonts.displayStrong}]}>Protect your session</Text>
   <View style={[s.card,{backgroundColor:c.surface,borderColor:c.border}]}>
    <View style={s.row}><View style={{flex:1}}><Text style={{color:c.text,fontWeight:"900",fontSize:16}}>Biometric unlock</Text><Text style={{color:c.muted,marginTop:5}}>{enabled?"Enabled on this device":"Disabled"}</Text></View><Text style={{color:enabled?c.success:c.muted,fontWeight:"900"}}>{busy?"…":enabled?"ON":"OFF"}</Text></View><Button title={enabled?"Disable biometric unlock":"Enable biometric unlock"} variant={enabled?"ghost":"primary"} onPress={()=>void toggle()} disabled={busy}/>
   </View>
   <View style={[s.card,{backgroundColor:c.surface,borderColor:c.border}]}>
    <Text style={[s.section,{color:c.text}]}>Authenticator MFA</Text><Text style={{color:c.muted,lineHeight:20}}>Protect account login with a TOTP authenticator app.</Text>
    {!mfa?<Button title={loadingMfa?"Starting…":"Set up MFA"} onPress={()=>void setupMfa()} disabled={loadingMfa}/>:<><Text style={{color:c.muted}}>Add this secret to your authenticator app:</Text><Text selectable style={[s.secret,{color:c.text,backgroundColor:c.surface2}]}>{mfa.secret}</Text><Text selectable style={{color:c.primary,fontSize:12}}>{mfa.otpauthUrl}</Text><Input label="6-digit authenticator code" value={code} onChangeText={setCode} keyboardType="number-pad" maxLength={6}/><Button title="Enable MFA" onPress={()=>void enableMfa()} disabled={code.length!==6}/></>}
   </View>
   <View style={[s.card,{backgroundColor:c.surface,borderColor:c.border}]}>
    <Text style={[s.section,{color:c.text}]}>Active sessions</Text>
    {sessions.map(x=><View key={x.id} style={[s.session,{borderBottomColor:c.border}]}><View style={{flex:1}}><Text style={{color:c.text,fontWeight:"800"}}>{x.user_agent||"Mobile session"}</Text><Text style={{color:c.muted,fontSize:12}}>{x.ip||"Unknown IP"} · {x.expires_at?new Date(x.expires_at).toLocaleDateString():""}</Text></View><Button title="Revoke" size="sm" variant="ghost" onPress={()=>void revoke(x.id)}/></View>)}{!sessions.length&&<Text style={{color:c.muted}}>No active sessions returned.</Text>}
   </View>
 </ScrollView>
}
const s=StyleSheet.create({root:{flex:1},pad:{padding:spacing.lg,paddingBottom:70,gap:13},eyebrow:{fontSize:11,letterSpacing:2},h1:{fontSize:32,marginTop:5},card:{borderWidth:1,borderRadius:18,padding:16,gap:12},row:{flexDirection:"row",alignItems:"center"},section:{fontWeight:"900",fontSize:18},secret:{fontFamily:"monospace",padding:12,borderRadius:10,fontSize:13},session:{paddingVertical:10,borderBottomWidth:1,flexDirection:"row",alignItems:"center",gap:10}});