
import { Pressable, StyleSheet, Text, View } from "react-native";
import type { SearchItem } from "../lib/api";

export function PropertyCard({ item, onPress }: { item: SearchItem; onPress: () => void }) {
  const money = new Intl.NumberFormat("en-RW", { maximumFractionDigits: 0 }).format(item.listing.priceMinor);
  return (
    <Pressable onPress={onPress} style={styles.card}>
      <View style={styles.image}><Text style={styles.imageText}>IMIZI</Text></View>
      <View style={styles.body}>
        <Text style={styles.title} numberOfLines={1}>{item.property.title}</Text>
        <Text style={styles.muted}>{item.property.district}, {item.property.province}</Text>
        <Text style={styles.price}>{money} {item.listing.currency}{item.listing.listingType === "RENT" ? " / month" : ""}</Text>
        <Text style={styles.muted}>{item.property.bedrooms ?? 0} beds · {item.property.bathrooms ?? 0} baths · {item.property.parking ?? 0} parking</Text>
      </View>
    </Pressable>
  );
}
const styles=StyleSheet.create({
  card:{backgroundColor:"#fff",borderRadius:18,overflow:"hidden",marginBottom:14,borderWidth:1,borderColor:"#e7e2da"},
  image:{height:130,backgroundColor:"#dce7e0",alignItems:"center",justifyContent:"center"},
  imageText:{fontSize:28,fontWeight:"900",letterSpacing:4,color:"#21583f"},
  body:{padding:14},title:{fontSize:18,fontWeight:"800",color:"#171717"},
  muted:{color:"#6a6a6a",marginTop:4},price:{fontSize:18,fontWeight:"900",marginTop:8,color:"#171717"}
});
