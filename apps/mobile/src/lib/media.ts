import * as ImagePicker from "expo-image-picker";
import { api } from "./api";

type Kind="PHOTO"|"VIDEO"|"TOUR_360";
export async function pickAndUploadPropertyMedia(propertyId:string,kind:Kind){
  const permission=await ImagePicker.requestMediaLibraryPermissionsAsync();
  if(!permission.granted)throw new Error("Photo and video permission is required.");
  const result=await ImagePicker.launchImageLibraryAsync({
    mediaTypes: kind==="VIDEO"?["videos"]:["images"],
    allowsMultipleSelection:true,
    selectionLimit:8,
    quality:0.9,
    exif:false,
  });
  if(result.canceled)return [];
  const completed:any[]=[];
  for(const asset of result.assets){
    const uri=asset.uri;
    const contentType=asset.mimeType || (asset.type==="video"?"video/mp4":"image/jpeg");
    const filename=asset.fileName || ("media-"+Date.now()+"."+(asset.type==="video"?"mp4":"jpg"));
    const signed=await api<any>("/media/signed-url",{method:"POST",body:JSON.stringify({propertyId,filename,contentType,kind})},true);
    if(!signed?.uploadUrl)throw new Error("The storage upload URL was not created.");
    const body=await fetch(uri).then(x=>x.blob());
    const put=await fetch(signed.uploadUrl,{method:"PUT",headers:signed.headers||{"Content-Type":contentType},body});
    if(!put.ok)throw new Error("Media upload failed for "+filename);
    const resultRows=await api<any[]>("/media/complete",{method:"POST",body:JSON.stringify({propertyId,key:signed.key,kind})},true);
    completed.push(...(resultRows||[]));
  }
  return completed;
}