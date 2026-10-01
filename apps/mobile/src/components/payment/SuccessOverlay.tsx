import React,{useEffect}from"react";
import{Pressable,StyleSheet,Text,View}from"react-native";
import Svg,{Circle,Path}from"react-native-svg";
import Animated,{useAnimatedProps,useSharedValue,withTiming}from"react-native-reanimated";
import LottieView from"lottie-react-native";
import{success}from"../../lib/haptics";
import{useTheme}from"../../stores/theme";
const AP=Animated.createAnimatedComponent(Path);
export function SuccessOverlay({title="Payment successful",subtitle,onDone}:{title?:string;subtitle?:string;onDone?:()=>void}){
 const c=useTheme(s=>s.palette),p=useSharedValue(90);
 useEffect(()=>{p.value=withTiming(0,{duration:600});success()},[]);
 const a=useAnimatedProps(()=>({strokeDashoffset:p.value}));
 return <View style={[s.wrap,{backgroundColor:c.primary}]}>
   <LottieView source={require("../../../assets/confetti.json")} autoPlay loop={false} style={s.confetti}/>
   <Svg width={100} height={100}><Circle cx="50" cy="50" r="44" fill="none" stroke={c.primaryFg} strokeWidth="5"/><AP d="M28 52 L44 67 L74 35" fill="none" stroke={c.primaryFg} strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="90" animatedProps={a}/></Svg>
   <Text style={[s.t,{color:c.primaryFg}]}>{title}</Text>
   {subtitle&&<Text style={[s.sub,{color:c.primaryFg}]}>{subtitle}</Text>}{onDone&&<Pressable accessibilityRole="button" onPress={onDone} style={[s.done,{borderColor:c.primaryFg}]}><Text style={{color:c.primaryFg,fontWeight:"800"}}>Continue</Text></Pressable>}
 </View>
}
const s=StyleSheet.create({sub:{maxWidth:320,textAlign:"center",marginTop:8,lineHeight:20},wrap:{position:"absolute",top:0,left:0,right:0,bottom:0,alignItems:"center",justifyContent:"center"},confetti:{position:"absolute",top:0,left:0,right:0,bottom:0},t:{fontSize:24,fontWeight:"800",marginTop:20},done:{marginTop:24,borderWidth:1,borderRadius:14,paddingHorizontal:22,paddingVertical:12}});