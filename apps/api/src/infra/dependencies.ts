import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from "@nestjs/common";
import Redis from "ioredis";
import { Pool } from "pg";
import { loadConfig } from "@imizi/config";

@Injectable()
export class Dependencies implements OnModuleInit, OnModuleDestroy {
  private readonly log = new Logger(Dependencies.name);
  db?: Pool;
  databaseOk = false;
  redis?: Redis;
  redisOk = false;
  searchOk = false;
  storageOk = false;
  paymentOk = false;

  async onModuleInit() {
    const config=loadConfig();
    if(config.databaseUrl){
      try{
        this.db=new Pool({connectionString:config.databaseUrl,max:10,idleTimeoutMillis:30000});
        await this.db.query("SELECT 1");
        this.databaseOk=true;
      }catch(error){this.log.error("PostgreSQL unavailable: "+String(error));}
    } else this.log.error("DATABASE_URL is required");

    try{
      this.redis=new Redis(config.redisUrl,{maxRetriesPerRequest:1,lazyConnect:true,enableOfflineQueue:false});
      await this.redis.connect();await this.redis.ping();this.redisOk=true;
    }catch(error){this.redisOk=false;this.log.warn("Redis unavailable: "+String(error));}

    try{
      const health=await fetch(config.opensearchUrl+"/_cluster/health",{signal:AbortSignal.timeout(2000)});
      if(!health.ok)throw new Error("OpenSearch health check failed");
      await this.ensureSearchIndex();
      this.searchOk=true;
    }catch(error){this.searchOk=false;this.log.warn("OpenSearch unavailable: "+String(error));}

    this.storageOk=Boolean(config.s3Endpoint && config.s3AccessKey && config.s3SecretKey && config.s3BucketPublic);
    this.paymentOk=Boolean(
      (process.env.MTN_MOMO_SUBSCRIPTION_KEY && process.env.MTN_MOMO_API_USER && process.env.MTN_MOMO_API_KEY) ||
      process.env.FLUTTERWAVE_SECRET_KEY
    );
  }

  async onModuleDestroy(){await this.redis?.quit();await this.db?.end();}

  async cacheGet<T>(key:string):Promise<T|undefined>{
    if(!this.redisOk||!this.redis)return undefined;
    try{const raw=await this.redis.get(key);return raw?JSON.parse(raw) as T:undefined;}catch{return undefined;}
  }

  async cacheSet(key:string,value:unknown,ttlSeconds=15){
    if(!this.redisOk||!this.redis)return;
    try{await this.redis.set(key,JSON.stringify(value),"EX",ttlSeconds);}catch{}
  }

  async ensureSearchIndex(){
    const config=loadConfig();
    const exists=await fetch(config.opensearchUrl+"/"+encodeURIComponent(config.opensearchIndex));
    if(exists.ok)return;
    if(exists.status!==404)throw new Error("Unable to inspect OpenSearch index");
    const mapping={
      settings:{number_of_shards:1,number_of_replicas:0},
      mappings:{properties:{
        id:{type:"keyword"},listingId:{type:"keyword"},listingType:{type:"keyword"},status:{type:"keyword"},
        priceMinor:{type:"long"},currency:{type:"keyword"},availableFrom:{type:"date"},createdAt:{type:"date"},updatedAt:{type:"date"},
        title:{type:"text"},description:{type:"text"},propertyType:{type:"keyword"},verificationStatus:{type:"keyword"},
        bedrooms:{type:"integer"},bathrooms:{type:"integer"},parking:{type:"integer"},district:{type:"keyword"},
        province:{type:"keyword"},sector:{type:"keyword"},amenities:{type:"keyword"},ownerId:{type:"keyword"},
        organizationId:{type:"keyword"},propertyStatus:{type:"keyword"},location:{type:"geo_point"}
      }}
    };
    const created=await fetch(config.opensearchUrl+"/"+encodeURIComponent(config.opensearchIndex),{
      method:"PUT",headers:{"content-type":"application/json"},body:JSON.stringify(mapping)
    });
    if(!created.ok && created.status!==400) throw new Error("Failed to create OpenSearch index");
  }

  async indexListing(doc:Record<string,unknown>){
    const config=loadConfig();
    if(!this.searchOk){
      try{
        const health=await fetch(config.opensearchUrl+"/_cluster/health",{signal:AbortSignal.timeout(1500)});
        if(!health.ok) return false;
        await this.ensureSearchIndex();
        this.searchOk=true;
      }catch{return false;}
    }
    try{
      const response=await fetch(config.opensearchUrl+"/"+encodeURIComponent(config.opensearchIndex)+"/_doc/"+encodeURIComponent(String(doc.id)),{
        method:"PUT",headers:{"content-type":"application/json"},body:JSON.stringify(doc)
      });
      if(!response.ok)return false;
      return true;
    }catch{
      this.searchOk=false;
      return false;
    }
  }

  async searchListings(body:Record<string,unknown>){
    const config=loadConfig();if(!this.searchOk)return undefined;
    const result=await fetch(config.opensearchUrl+"/"+encodeURIComponent(config.opensearchIndex)+"/_search",{
      method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify(body),signal:AbortSignal.timeout(2500)
    });
    if(!result.ok){this.searchOk=false;return undefined;}
    return result.json() as Promise<any>;
  }
}