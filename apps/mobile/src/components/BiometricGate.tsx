import{useEffect,useState}from"react";
import{ActivityIndicator,Pressable,StyleSheet,Text,View}from"react-native";
import*as LocalAuthentication from"expo-local-authentication";
import*as SecureStore from"expo-secure-store";
import{useTheme}from"../stores/theme";import{isSignedIn}from"../lib/session";
import{fonts}from"../theme";

export function BiometricGate({children}:{children:React.ReactNode}){
 const c=useTheme(s=>s.palette);const[ready,setReady]=useState(false);const[locked,setLocked]=useState(false);const[message,setMessage]=useState("");
 const unlock=async()=>{
  setMessage("");
  try{
    const signedIn=await isSignedIn();
    const enabled=await SecureStore.getItemAsync("imizi.biometricUnlock")==="enabled";
    if(!signedIn||!enabled){setLocked(false);setReady(true);return;}
    const has=await LocalAuthentication.hasHardwareAsync();
    const enrolled=await LocalAuthentication.isEnrolledAsync();
    if(!has||!enrolled){setLocked(false);setReady(true);return;}
    setLocked(true);
    const result=await LocalAuthentication.authenticateAsync({promptMessage:"Unlock Imizi",cancelLabel:"Not now",disableDeviceFallback:false});
    if(result.success){setLocked(false);setReady(true);}else setMessage("Authenticate to continue.");
  }catch(e){setMessage("Biometric unlock could not be completed. Try again.");}
 };
 useEffect(()=>{void unlock()},[]);
 if(!ready||locked)return <View style={[s.root,{backgroundColor:c.bg}]}><Text style={[s.logo,{color:c.primary,fontFamily:fonts.displayStrong}]}>IMIZI</Text><ActivityIndicator color={c.primary}/><Text style={[s.message,{color:c.muted}]}>{message||"Securing your account…"}</Text>{locked&&<Pressable onPress={()=>void unlock()} style={[s.button,{backgroundColor:c.primary}]}><Text style={{color:c.primaryFg,fontWeight:"800"}}>Unlock</Text></Pressable>}</View>;
 return <>{children}</>;
}
const s=StyleSheet.create({root:{flex:1,alignItems:"center",justifyContent:"center",gap:14,padding:24},logo:{fontSize:34,letterSpacing:4},message:{textAlign:"center",lineHeight:20},button:{paddingHorizontal:24,paddingVertical:13,borderRadius:14}});