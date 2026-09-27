import React from "react"; import { Image, ImageStyle } from "expo-image"; import { StyleProp } from "react-native";
const BLURHASH="LEHV6nWB2yk8pyo0adR*.7kCMdnj";
export function RemoteImage({uri,style,contentFit="cover",accessibilityLabel}:{uri?:string;style?:StyleProp<ImageStyle>;contentFit?:"cover"|"contain"|"fill"|"none"|"scale-down";accessibilityLabel?:string}){if(!uri)return null;return <Image source={{uri}} style={style} contentFit={contentFit} placeholder={{blurhash:BLURHASH}} transition={160} accessibilityLabel={accessibilityLabel}/>;}
