import { Injectable } from "@nestjs/common";
import { clampLimit, parseNaturalSearch } from "@imizi/domain";
import { DatabaseService } from "../../infra/database.service";
import { Dependencies } from "../../infra/dependencies";

@Injectable()
export class SearchService {
  constructor(private readonly db:DatabaseService,private readonly deps:Dependencies){}

  async search(query:Record<string,any>){
    const parsed=query.q ? parseNaturalSearch(String(query.q)) : undefined;
    const limit=clampLimit(query.limit ? Number(query.limit) : 20);
    const cacheKey="search:"+JSON.stringify({...query,limit});
    const cached=await this.deps.cacheGet<any>(cacheKey);
    if(cached)return cached;

    const listingType=query.listingType ?? parsed?.listingType;
    const propertyType=query.propertyType ?? parsed?.type;
    const district=query.district ?? parsed?.locationText;
    const must:any[]=[];
    const filter:any[]=[
      {term:{status:"ACTIVE"}},
      {term:{propertyStatus:"PUBLISHED"}}
    ];

    const addTerm=(field:string,value:any)=>{if(value!==undefined&&value!==null&&value!=="")filter.push({term:{[field]:value}});};
    addTerm("listingType",listingType);
    addTerm("propertyType",propertyType);
    addTerm("district",district);
    addTerm("province",query.province);
    addTerm("sector",query.sector);
    addTerm("verificationStatus",query.verifiedOnly ? "VERIFIED" : undefined);
    if(query.bedroomsMin ?? parsed?.bedrooms)filter.push({range:{bedrooms:{gte:Number(query.bedroomsMin ?? parsed?.bedrooms)}}});
    if(query.bedroomsMax!=null)filter.push({range:{bedrooms:{lte:Number(query.bedroomsMax)}}});
    if(query.bathroomsMin!=null)filter.push({range:{bathrooms:{gte:Number(query.bathroomsMin)}}});
    if(query.minPriceMinor!=null)filter.push({range:{priceMinor:{gte:Number(query.minPriceMinor)}}});
    if(query.maxPriceMinor ?? parsed?.maxPrice)filter.push({range:{priceMinor:{lte:Number(query.maxPriceMinor ?? parsed?.maxPrice)}}});
    const amenities=Array.isArray(query.amenities)?query.amenities:String(query.amenities ?? "").split(",").map((x:string)=>x.trim()).filter(Boolean);
    for(const amenity of amenities)filter.push({term:{amenities:String(amenity).toLowerCase()}});

    if(query.lat!=null&&query.lng!=null&&query.radiusKm!=null){
      filter.push({geo_distance:{distance:Number(query.radiusKm)+"km",location:{lat:Number(query.lat),lon:Number(query.lng)}}});
    }

    if(query.q)must.push({
      multi_match:{query:String(query.q),fields:["title^4","description^2","district^3","province","propertyType","amenities"],fuzziness:"AUTO"}
    });

    const body={
      size:limit,
      track_total_hits:false,
      query:{bool:{must,filter}},
      sort:[
        ...(query.lat!=null&&query.lng!=null ? [{_geo_distance:{location:{lat:Number(query.lat),lon:Number(query.lng)},order:"asc",unit:"m",mode:"min",distance_type:"arc",ignore_unmapped:true}}] : []),
        {_score:"desc"},{updatedAt:"desc"},{listingId:"desc"}
      ]
    };

    const os=await this.deps.searchListings(body);
    if(os){
      const items=(os.hits?.hits ?? []).map((hit:any)=>{
        const s=hit._source;
        return {
          score:Number(hit._score ?? 0),
          distanceMeters:hit.sort?.find((x:any)=>typeof x==="number") ?? undefined,
          listing:{
            id:s.listingId,listingType:s.listingType,priceMinor:Number(s.priceMinor),currency:s.currency,availableFrom:s.availableFrom,
            status:s.status,createdAt:s.createdAt,updatedAt:s.updatedAt,propertyId:s.id
          },
          property:{
            id:s.id,title:s.title,description:s.description,district:s.district,province:s.province,sector:s.sector,
            propertyType:s.propertyType,bedrooms:s.bedrooms,bathrooms:s.bathrooms,parking:s.parking,
            verificationStatus:s.verificationStatus,amenities:s.amenities ?? [],
            media:[],
            latitude:s.location?.lat,longitude:s.location?.lon
          }
        };
      });
      const payload={items,nextCursor:null,engine:"opensearch"};
      await this.deps.cacheSet(cacheKey,payload,15);
      return payload;
    }

    const result=await this.db.searchListings({
      q:query.q,listingType:listingType,propertyType:propertyType,province:query.province,district:district,sector:query.sector,
      bedroomsMin:query.bedroomsMin ?? parsed?.bedrooms,bedroomsMax:query.bedroomsMax,bathroomsMin:query.bathroomsMin,
      minPriceMinor:query.minPriceMinor,maxPriceMinor:query.maxPriceMinor ?? parsed?.maxPrice,currency:query.currency,
      amenities:query.amenities,verifiedOnly:Boolean(query.verifiedOnly),availableFrom:query.availableFrom,radiusKm:query.radiusKm,
      lat:query.lat==null?undefined:Number(query.lat),lng:query.lng==null?undefined:Number(query.lng),
      north:query.north==null?undefined:Number(query.north),south:query.south==null?undefined:Number(query.south),
      east:query.east==null?undefined:Number(query.east),west:query.west==null?undefined:Number(query.west),limit
    });
    const payload={items:result,nextCursor:null,engine:"postgres-postgis"};
    await this.deps.cacheSet(cacheKey,payload,10);
    return payload;
  }

  async suggest(q:string){
    const key="suggest:"+q.toLowerCase();
    const cached=await this.deps.cacheGet<any>(key);if(cached)return cached;
    const parsed=parseNaturalSearch(q);
    const payload={parsed,suggestions:["Kigali","Kicukiro","Gasabo","Musanze","Rubavu","Huye"]};
    await this.deps.cacheSet(key,payload,300);
    return payload;
  }
}
