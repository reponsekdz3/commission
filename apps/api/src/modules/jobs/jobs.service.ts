import { Injectable, Logger, OnModuleInit } from "@nestjs/common";
import { DatabaseService } from "../../infra/database.service";
import { Dependencies } from "../../infra/dependencies";

@Injectable()
export class JobsService implements OnModuleInit {
  private readonly log=new Logger(JobsService.name);
  constructor(private readonly db:DatabaseService,private readonly deps:Dependencies){}
  onModuleInit(){setInterval(()=>void this.drain(),5000).unref();}
  async drain(){
    if(!this.deps.databaseOk)return;
    const jobs=await this.db.query(
      "SELECT id,name,payload FROM background_jobs WHERE status='PENDING' AND run_at<=now() ORDER BY created_at LIMIT 20 FOR UPDATE SKIP LOCKED",
    ).catch(()=>({rows:[] as any[]}));
    for(const job of jobs.rows){
      await this.db.query("UPDATE background_jobs SET status='RUNNING',attempts=attempts+1,updated_at=now() WHERE id=$1",[job.id]);
      try{
        if(job.name==="search.index"){
          const payload=job.payload ?? {};
          const listingId=payload.listingId as string|undefined;
          const listing=listingId ? await this.db.getListing(listingId) : undefined;
          if(listing){
            const property=await this.db.getProperty(listing.propertyId);
            if(property){
              await this.deps.indexListing({
                id:property.id,listingId:listing.id,listingType:listing.listingType,status:listing.status,
                priceMinor:listing.priceMinor,currency:listing.currency,availableFrom:listing.availableFrom,
                createdAt:listing.createdAt,updatedAt:listing.updatedAt,title:property.title,description:property.description,
                propertyType:property.propertyType,verificationStatus:property.verificationStatus,bedrooms:property.bedrooms,
                bathrooms:property.bathrooms,parking:property.parking,district:property.district,province:property.province,
                sector:property.sector,amenities:property.amenities,ownerId:property.ownerId,organizationId:property.organizationId,
                propertyStatus:property.status,updatedAt:property.updatedAt,location:{lat:property.latitude,lon:property.longitude}
              });
            }
          }
        }
        await this.db.query("UPDATE background_jobs SET status='DONE',updated_at=now(),finished_at=now() WHERE id=$1",[job.id]);
      }catch(error){
        this.log.error("Job "+job.id+" failed: "+String(error));
        await this.db.query("UPDATE background_jobs SET status=CASE WHEN attempts>=5 THEN 'FAILED' ELSE 'PENDING' END,updated_at=now(),last_error=$2 WHERE id=$1",[job.id,String(error)]);
      }
    }
  }
}
