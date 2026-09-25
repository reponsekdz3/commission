
import { useRouter } from "expo-router";
import { useState } from "react";
import { Alert, Pressable, SafeAreaView, StyleSheet, Text, TextInput, View } from "react-native";
import { login } from "../src/lib/api";
import { saveTokens } from "../src/lib/auth";
import { registerPushToken } from "../src/lib/notifications";

export default function Login() {
  const router=useRouter();
  const [identifier,setIdentifier]=useState("");
  const [password,setPassword]=useState("");
  const [mfaCode,setMfaCode]=useState("");
  const [busy,setBusy]=useState(false);
  async function submit(){
    setBusy(true);
    try{
      const data=await login(identifier,password,mfaCode||undefined);
      await saveTokens(data.accessToken,data.refreshToken);
      await registerPushToken();
      router.replace("/");
    }catch(error){Alert.alert("Sign in failed",error instanceof Error?error.message:"Unable to sign in");}
    finally{setBusy(false);}
  }
  return <SafeAreaView style={styles.safe}><View style={styles.wrap}>
    <Text style={styles.title}>Welcome back</Text>
    <Text style={styles.muted}>Use email or phone and your Imizi password.</Text>
    <TextInput autoCapitalize="none" value={identifier} onChangeText={setIdentifier} placeholder="Email or phone" style={styles.input}/>
    <TextInput secureTextEntry value={password} onChangeText={setPassword} placeholder="Password" style={styles.input}/>
    <TextInput keyboardType="number-pad" value={mfaCode} onChangeText={setMfaCode} placeholder="MFA code (if enabled)" style={styles.input}/>
    <Pressable disabled={busy} onPress={submit} style={styles.button}><Text style={styles.buttonText}>{busy?"Signing in...":"Sign in"}</Text></Pressable>
  </View></SafeAreaView>;
}
const styles=StyleSheet.create({safe:{flex:1,backgroundColor:"#f7f3eb"},wrap:{padding:22,gap:14},title:{fontSize:34,fontWeight:"900"},muted:{color:"#65615b",lineHeight:20},input:{backgroundColor:"#fff",borderRadius:14,padding:15,fontSize:16,borderWidth:1,borderColor:"#e7e2da"},button:{backgroundColor:"#21583f",padding:16,borderRadius:14,alignItems:"center"},buttonText:{color:"#fff",fontWeight:"900",fontSize:16}});
