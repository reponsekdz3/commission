import * as Haptics from "expo-haptics";
import { AccessibilityInfo, Platform } from "react-native";
let reduce=false;
void AccessibilityInfo.isReduceMotionEnabled().then(v=>{reduce=v;});
AccessibilityInfo.addEventListener("reduceMotionChanged",v=>{reduce=v;});
export const isReducedMotion=()=>reduce;
export function tap(kind:"light"|"medium"|"heavy"="light"){if(Platform.OS==="web"||reduce)return;void Haptics.impactAsync(kind==="heavy"?Haptics.ImpactFeedbackStyle.Heavy:kind==="medium"?Haptics.ImpactFeedbackStyle.Medium:Haptics.ImpactFeedbackStyle.Light);}
export const impact=tap;
export function selection(){if(Platform.OS!=="web"&&!reduce)void Haptics.selectionAsync();}
export function success(){if(Platform.OS!=="web"&&!reduce)void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);}
export function error(){if(Platform.OS!=="web"&&!reduce)void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);}
export const commit=()=>tap("medium"); export const menuOpen=()=>tap("light"); export const snap=selection; export const pinDigit=()=>tap("light");
