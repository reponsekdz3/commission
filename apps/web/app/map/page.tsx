import { api } from "../../lib/api";
import { MapClient, MapResultList } from "./map-client";

export default async function MapPage(){
  const data=await api<{items:any[]}>("/search?listingType=RENT&limit=50");
  return <main className="wrap" style={{paddingTop:24}}>
    <h1>Map view</h1>
    <p className="muted">Live property coordinates from PostGIS. Move the map and select a listing to inspect it.</p>
    <MapClient items={data.items}/>
    <MapResultList items={data.items}/>
  </main>;
}
