import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import { api } from "./api";

export async function registerPushToken(){
  try{
    const permissions=await Notifications.getPermissionsAsync();
    let status=permissions.status;
    if(status!=="granted"){
      status=(await Notifications.requestPermissionsAsync()).status;
    }
    if(status!=="granted")return undefined;
    const projectId=process.env.EXPO_PUBLIC_EAS_PROJECT_ID;
    const token=(await Notifications.getExpoPushTokenAsync(projectId?{projectId}:undefined)).data;
    await api("/notifications/push-token",{method:"POST",body:JSON.stringify({token,platform:Platform.OS})});
    return token;
  }catch{return undefined;}
}
