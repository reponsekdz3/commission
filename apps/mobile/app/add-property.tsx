import { router } from "expo-router";
import { useEffect, useState } from "react";
import { Alert, FlatList, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { api } from "../src/lib/api";
import { pickAndUploadPropertyMedia } from "../src/lib/media";
import { Button, Chip, Input } from "../src/components/ui";
import { useTheme } from "../src/stores/theme";
import { fonts, spacing } from "../src/theme";
import { commit } from "../src/lib/haptics";

type Item={id:string;name:string;code:string};
const levels=[["provinceId","province","PROVINCE"],["districtId","district","DISTRICT"],["sectorId","sector","SECTOR"],["cellId","cell","CELL"],["villageId","village","VILLAGE"]] as const;
const propertyTypes=["HOUSE","APARTMENT","VILLA","STUDIO","OFFICE","SHOP","WAREHOUSE","LAND","MIXED_USE"];
const amenities=["Water","Electricity","Internet","Security","Parking","Furnished","Generator","Water tank"];

function Select({label,items,value,onChange,disabled}:{label:string;items:Item[];value:string;onChange:(id:string)=>void;disabled?:boolean}){
 const c=useTheme(s=>s.palette);const[open,setOpen]=useState(false);const[q,setQ]=useState("");
 const selected=items.find(x=>x.id===value);
 return <><Pressable style={[s.select,{backgroundColor:c.surface,borderColor:c.border},disabled&&{opacity:.45}]} disabled={disabled} onPress={()=>setOpen(true)}><Text style={{color:selected?c.text:c.subtle,fontWeight:selected?"800":"500"}}>{selected?.name||"Select "+label}</Text><Text style={{color:c.muted}}>⌄</Text></Pressable>
 <Modal visible={open} transparent animationType="slide" onRequestClose={()=>setOpen(false)}><View style={[s.modal,{backgroundColor:c.scrim}]}><View style={[s.sheet,{backgroundColor:c.surface}]}><Text style={[s.h2,{color:c.text}]}>Select {label}</Text><TextInput style={[s.search,{backgroundColor:c.surface2,color:c.text,borderColor:c.border}]} placeholder={"Search "+label} placeholderTextColor={c.subtle} value={q} onChangeText={setQ}/><FlatList data={items.filter(x=>x.name.toLowerCase().includes(q.toLowerCase()))} keyExtractor={x=>x.id} renderItem={({item})=><Pressable style={[s.option,{borderBottomColor:c.border}]} onPress={()=>{onChange(item.id);setOpen(false);setQ("")}}><Text style={{color:c.text,fontWeight:"800"}}>{item.name}</Text><Text style={{color:c.muted,fontSize:12}}>{item.code}</Text></Pressable>}/><Button title="Close" variant="ghost" onPress={()=>setOpen(false)}/></View></View></Modal></>
}

export default function AddProperty(){
 const c=useTheme(s=>s.palette);
 const[f,setF]=useState<any>({title:"",description:"",propertyType:"HOUSE",listingType:"RENT",priceMinor:"",currency:"RWF",provinceId:"",districtId:"",sectorId:"",cellId:"",villageId:"",province:"",district:"",sector:"",cell:"",village:"",latitude:"",longitude:"",bedrooms:"",bathrooms:"",parking:"0",areaValue:"",areaUnit:"SQM",amenities:[]});
 const[o,setO]=useState<Record<string,Item[]>>({PROVINCE:[],DISTRICT:[],SECTOR:[],CELL:[],VILLAGE:[]});
 const[propertyId,setPropertyId]=useState("");const[busy,setBusy]=useState(false);const[uploading,setUploading]=useState(false);const[err,setErr]=useState("");const[mediaCount,setMediaCount]=useState(0);
 useEffect(()=>{void load("PROVINCE")},[]);
 async function load(level:string,parentId?:string){
  try{const p=parentId?"?level="+level+"&parentId="+parentId:"?level="+level;const rows=await api<Item[]>("/locations/rwanda"+p);setO(x=>({...x,[level]:rows}));}
  catch(e){setErr(e instanceof Error?e.message:"Unable to load Rwanda locations")}
 }
 function choose(key:string,name:string,level:string,id:string){
  const idx=levels.findIndex(x=>x[0]===key),next:any={...f,[key]:id,[name]:o[level].find(x=>x.id===id)?.name||""};
  for(let i=idx+1;i<levels.length;i++){next[levels[i][0]]="";next[levels[i][1]]=""}
  setF(next);
  if(level!=="VILLAGE")void load(levels[idx+1][2],id);
 }
 function toggleAmenity(a:string){setF((x:any)=>({...x,amenities:x.amenities.includes(a)?x.amenities.filter((v:string)=>v!==a):[...x.amenities,a]}))}
 function valid(){
  if(!f.title.trim()||f.description.trim().length<20) return "Add a title and a detailed description (at least 20 characters).";
  if(!f.provinceId||!f.districtId||!f.sectorId||!f.cellId)return "Select Province, District, Sector and Cell.";
  if(!f.latitude||!f.longitude)return "Set the exact map coordinates for the property.";
  if(!f.priceMinor||Number(f.priceMinor)<=0)return "Enter a valid listing price.";
  if(Number(f.bedrooms)<0||Number(f.bathrooms)<0)return "Bedrooms and bathrooms cannot be negative.";
  return "";
 }
 async function create(){
  const message=valid();if(message){setErr(message);return;}
  setBusy(true);setErr("");
  try{
    const p=await api<any>("/properties",{method:"POST",body:JSON.stringify({
      ...f,latitude:Number(f.latitude),longitude:Number(f.longitude),bedrooms:Number(f.bedrooms),bathrooms:Number(f.bathrooms),parking:Number(f.parking||0),areaValue:f.areaValue?Number(f.areaValue):undefined
    })},true);
    const listing=await api<any>("/listings",{method:"POST",body:JSON.stringify({propertyId:p.id,listingType:f.listingType,priceMinor:Number(f.priceMinor),currency:f.currency,availableFrom:new Date().toISOString()})},true);
    setPropertyId(String(p.id));setErr("");commit();
    if(listing?.id)Alert.alert("Property created","Your listing is saved. Add photos and videos before publishing.");
  }catch(e){setErr(e instanceof Error?e.message:"Unable to create property and listing")}
  finally{setBusy(false)}
 }
 async function upload(kind:"PHOTO"|"VIDEO"|"TOUR_360"){
  if(!propertyId){setErr("Create the property first.");return;}
  setUploading(true);setErr("");
  try{const rows=await pickAndUploadPropertyMedia(propertyId,kind);setMediaCount(rows.length);commit();Alert.alert("Upload complete",rows.length+" media item(s) added. Processing continues securely on the backend.");}
  catch(e){setErr(e instanceof Error?e.message:"Media upload failed")}finally{setUploading(false)}
 }
 return <View style={[s.root,{backgroundColor:c.bg}]}><ScrollView contentContainerStyle={s.pad}>
   <Text style={[s.eyebrow,{color:c.primary,fontFamily:fonts.sansBold}]}>LIST PROPERTY</Text>
   <Text style={[s.h1,{color:c.text,fontFamily:fonts.displayStrong}]}>Create a real listing</Text>
   <Text style={[s.lead,{color:c.muted}]}>Every Rwanda location is validated against the canonical Province → District → Sector → Cell → Village hierarchy. Nothing is silently filled for you.</Text>

   {!!err&&<Text style={[s.error,{color:c.danger,backgroundColor:c.dangerSoft}]}>{err}</Text>}
   <Input label="Property title" value={f.title} onChangeText={v=>setF({...f,title:v})} placeholder="e.g. Modern 3-bedroom house in Kicukiro"/>
   <Input label="Description" value={f.description} onChangeText={v=>setF({...f,description:v})} multiline numberOfLines={6} style={s.textarea} placeholder="Describe rooms, utilities, access, nearby services and important terms."/>
   <Text style={[s.h2,{color:c.text}]}>Property type</Text><View style={s.chips}>{propertyTypes.map(x=><Chip key={x} label={x} active={f.propertyType===x} onPress={()=>setF({...f,propertyType:x})}/>)}</View>

   <Text style={[s.h2,{color:c.text}]}>Rwanda location</Text>
   {levels.map(([key,name,level],i)=><Select key={key} label={name} items={o[level]} value={f[key]} disabled={i>0&&!f[levels[i-1][0]]} onChange={id=>choose(key,name,level,id)}/>)}

   <Text style={[s.h2,{color:c.text}]}>Coordinates and size</Text>
   <View style={s.row}><Input label="Latitude" keyboardType="numeric" value={f.latitude} onChangeText={v=>setF({...f,latitude:v})} containerStyle={s.flex}/>
   <Input label="Longitude" keyboardType="numeric" value={f.longitude} onChangeText={v=>setF({...f,longitude:v})} containerStyle={s.flex}/></View>
   <View style={s.row}><Input label="Bedrooms" keyboardType="number-pad" value={f.bedrooms} onChangeText={v=>setF({...f,bedrooms:v})} containerStyle={s.flex}/>
   <Input label="Bathrooms" keyboardType="number-pad" value={f.bathrooms} onChangeText={v=>setF({...f,bathrooms:v})} containerStyle={s.flex}/></View>
   <Input label="Area" keyboardType="numeric" value={f.areaValue} onChangeText={v=>setF({...f,areaValue:v})} placeholder="Optional"/>

   <Text style={[s.h2,{color:c.text}]}>Listing and price</Text>
   <View style={s.chips}>{["RENT","SALE","SHORT_STAY"].map(x=><Chip key={x} label={x} active={f.listingType===x} onPress={()=>setF({...f,listingType:x})}/>)}</View>
   <Input label="Price in RWF minor units" keyboardType="number-pad" value={f.priceMinor} onChangeText={v=>setF({...f,priceMinor:v.replace(/\\D/g,"")})} placeholder="e.g. 500000"/>
   <Text style={[s.h2,{color:c.text}]}>Amenities</Text><View style={s.chips}>{amenities.map(x=><Chip key={x} label={x} active={f.amenities.includes(x)} onPress={()=>toggleAmenity(x)}/>)}</View>

   <Button title={busy?"Creating property…":propertyId?"Property created":"Create property & listing"} onPress={()=>void create()} loading={busy} disabled={busy||Boolean(propertyId)}/>

   {propertyId&&<View style={[s.mediaPanel,{backgroundColor:c.surface,borderColor:c.border}]}>
     <Text style={[s.h2,{color:c.text,marginTop:0}]}>Media pipeline</Text>
     <Text style={{color:c.muted}}>Upload photos first, then videos or a 360° tour. The backend verifies the uploaded object and queues optimization.</Text>
     <View style={s.row}><Button title={uploading?"Uploading…":"Add photos"} size="sm" onPress={()=>void upload("PHOTO")} disabled={uploading}/><Button title="Add video" size="sm" variant="ghost" onPress={()=>void upload("VIDEO")} disabled={uploading}/></View>
     <Button title="Add 360° tour" size="sm" variant="accent" onPress={()=>void upload("TOUR_360")} disabled={uploading}/>
     <Text style={{color:c.muted,fontSize:12}}>{mediaCount?mediaCount+" newly uploaded item(s) returned by the backend.":"No media uploaded in this session yet."}</Text>
     <Button title="Open property" variant="ghost" onPress={()=>router.replace("/property/"+propertyId)}/>
   </View>}
 </ScrollView></View>;
}
const s=StyleSheet.create({
 root:{flex:1},pad:{padding:spacing.lg,paddingBottom:70,gap:4},eyebrow:{fontSize:11,letterSpacing:2},h1:{fontSize:34,marginTop:5},h2:{fontSize:19,fontWeight:"900",marginTop:18,marginBottom:8},lead:{fontSize:14,lineHeight:21,marginBottom:8},chips:{flexDirection:"row",flexWrap:"wrap",gap:7},row:{flexDirection:"row",gap:9},flex:{flex:1},textarea:{minHeight:130,textAlignVertical:"top"},error:{padding:12,borderRadius:12,marginBottom:8,fontWeight:"700"},select:{borderWidth:1,borderRadius:14,padding:14,marginBottom:9,flexDirection:"row",justifyContent:"space-between"},modal:{flex:1,justifyContent:"flex-end"},sheet:{maxHeight:"85%",borderTopLeftRadius:28,borderTopRightRadius:28,padding:18},search:{borderWidth:1,borderRadius:12,padding:13,marginVertical:10},option:{padding:14,borderBottomWidth:1,flexDirection:"row",justifyContent:"space-between"},mediaPanel:{borderWidth:1,borderRadius:18,padding:15,marginTop:12,gap:10}
});