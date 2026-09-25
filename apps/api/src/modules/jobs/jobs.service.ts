import { Injectable, Logger, OnModuleInit } from "@nestjs/common";
import { createHash } from "crypto";
import { execFile } from "child_process";
import { promisify } from "util";
import { mkdtemp, readFile, rm, writeFile } from "fs/promises";
import { join } from "path";
import { tmpdir } from "os";
import { DatabaseService } from "../../infra/database.service";
import { Dependencies } from "../../infra/dependencies";
import { StorageService } from "../../infra/storage.service";

@Injectable()
export class JobsService implements OnModuleInit {
  private readonly log=new Logger(JobsService.name);
  private readonly exec=promisify(execFile);
  constructor(private readonly db:DatabaseService,private readonly deps:Dependencies,private readonly storage:StorageService){}
  onModuleInit(){setInterval(()=>void this.drain(),5000).unref();void this.drain();}
  async drain(){
    if(!this.deps.databaseOk)return;
    const jobs=await this.db.transaction(async(client)=>{
      const r=await client.query(
        "SELECT id,name,payload FROM background_jobs WHERE status='PENDING' AND run_at<=now() ORDER BY created_at LIMIT 20 FOR UPDATE SKIP LOCKED"
      );
      for(const job of r.rows) await client.query(
        "UPDATE background_jobs SET status='RUNNING',attempts=attempts+1,locked_at=now(),updated_at=now() WHERE id=$1",
        [job.id],
      );
      return r.rows;
    }).catch((error)=>{this.log.error("Job claim failed: "+String(error));return[] as any[];});

    for(const job of jobs){
      try{

        if(job.name==="notification.dispatch"){
          const notification=await this.db.getNotification(String(job.payload?.notificationId ?? ""));
          const user=await this.db.findUserById(String(job.payload?.userId ?? ""));
          if(notification && user){
            const prefs=await this.db.getNotificationPreferences(user.id);
            if(prefs.push_enabled){
              const tokens=await this.db.getPushTokens(user.id);
              for(const row of tokens){
                const response=await fetch("https://exp.host/--/api/v2/push/send",{
                  method:"POST",
                  headers:{"content-type":"application/json",...(process.env.EXPO_ACCESS_TOKEN?{Authorization:"Bearer "+process.env.EXPO_ACCESS_TOKEN}:{})},
                  body:JSON.stringify({to:row.token,sound:"default",title:notification.title,body:notification.body,data:{eventType:notification.event_type}}),
                  signal:AbortSignal.timeout(7000),
                });
                if(!response.ok) this.log.warn("Expo push rejected "+response.status);
              }
            }
            if(prefs.email_enabled && process.env.RESEND_API_KEY && process.env.EMAIL_FROM){
              const response=await fetch("https://api.resend.com/emails",{
                method:"POST",
                headers:{Authorization:"Bearer "+process.env.RESEND_API_KEY,"content-type":"application/json"},
                body:JSON.stringify({from:process.env.EMAIL_FROM,to:[user.email],subject:notification.title,text:notification.body}),
                signal:AbortSignal.timeout(7000),
              });
              if(!response.ok) this.log.warn("Resend email rejected "+response.status);
            }
            if(prefs.sms_enabled && process.env.SMS_PROVIDER_URL && process.env.SMS_PROVIDER_TOKEN){
              const response=await fetch(process.env.SMS_PROVIDER_URL,{
                method:"POST",
                headers:{Authorization:"Bearer "+process.env.SMS_PROVIDER_TOKEN,"content-type":"application/json"},
                body:JSON.stringify({to:user.phone,message:notification.title+": "+notification.body}),
                signal:AbortSignal.timeout(7000),
              });
              if(!response.ok) this.log.warn("SMS provider rejected "+response.status);
            }
          }
        }
        if(job.name==="booking.expire"){
          const booking=await this.db.getBooking(String(job.payload?.bookingId ?? ""));
          if(booking && (booking.status==="PENDING" || booking.status==="PAYMENT_PENDING")){
            const ageMs=Date.now()-new Date(booking.createdAt).getTime();
            if(ageMs>=30*60_000){
              await this.db.updateBookingStatus(booking.id,"EXPIRED");
              await this.db.query("INSERT INTO notifications(user_id,channel,event_type,title,body) VALUES($1,'in_app','BOOKING_EXPIRED','Booking expired',$2)",[booking.tenantId,"Your booking hold expired because payment was not completed."]);
            }else{
              const remaining=Math.max(5,Math.ceil((30*60_000-ageMs)/1000));
              await this.db.enqueueJob("booking.expire",{bookingId:booking.id},remaining);
            }
          }
        }
        if(job.name==="booking.activate"){
          const booking=await this.db.getBooking(String(job.payload?.bookingId ?? ""));
          if(booking && booking.status==="CONFIRMED"){
            if(new Date(booking.startDate).getTime()<=Date.now()) await this.db.updateBookingStatus(booking.id,"ACTIVE");
            else await this.db.enqueueJob("booking.activate",{bookingId:booking.id},Math.ceil((new Date(booking.startDate).getTime()-Date.now())/1000));
          }
        }
        if(job.name==="booking.complete"){
          const booking=await this.db.getBooking(String(job.payload?.bookingId ?? ""));
          if(booking && (booking.status==="CONFIRMED"||booking.status==="ACTIVE")){
            if(new Date(booking.endDate).getTime()<=Date.now()){
              await this.db.updateBookingStatus(booking.id,"COMPLETED");
              await this.db.query("INSERT INTO notifications(user_id,channel,event_type,title,body) VALUES($1,'in_app','RENTAL_COMPLETED','Rental completed',$2)",[booking.tenantId,"Your rental period has completed."]);
            }else{
              await this.db.enqueueJob("booking.complete",{bookingId:booking.id},Math.ceil((new Date(booking.endDate).getTime()-Date.now())/1000));
            }
          }
        }


        if(job.name==="media.process"){
          const media=await this.db.getMedia(String(job.payload?.mediaId ?? ""));
          if(media){
            if(media.kind!=="PHOTO") return;
            const input=await this.storage.readBuffer(String(media.storage_key));
            const checksum=createHash("sha256").update(input).digest("hex");
            const dir=await mkdtemp(join(tmpdir(),"imizi-media-"));
            try{
              const original=join(dir,"original.bin");
              await writeFile(original,input);
              const variants:Record<string,string>={};
              for(const size of [480,1024,1920]){
                const output=join(dir,size+".webp");
                await this.exec("magick",[original,"-auto-orient","-strip","-resize",size+"x"+size+">","-quality","82",output]);
                const optimized=await readFile(output);
                const key="property/"+media.property_id+"/optimized/"+media.id+"-"+size+".webp";
                await this.storage.putBuffer("public/"+key,"image/webp",optimized);
                variants[size===480?"small":size===1024?"medium":"large"]=key;
              }
              await this.db.updateMediaVariants(media.id,variants,checksum);
            }finally{
              await rm(dir,{recursive:true,force:true}).catch(()=>undefined);
            }
          }
        }

        if(job.name==="search.index"){
          const listingId=job.payload?.listingId as string|undefined;
          if(!listingId)throw new Error("search.index missing listingId");
          const listing=await this.db.getListing(listingId);
          if(listing){
            const property=await this.db.getProperty(listing.propertyId);
            if(property){
              const ok=await this.deps.indexListing({
                id:property.id,listingId:listing.id,listingType:listing.listingType,status:listing.status,
                priceMinor:listing.priceMinor,currency:listing.currency,availableFrom:listing.availableFrom,
                createdAt:listing.createdAt,updatedAt:listing.updatedAt,title:property.title,description:property.description,
                propertyType:property.propertyType,verificationStatus:property.verificationStatus,bedrooms:property.bedrooms,
                bathrooms:property.bathrooms,parking:property.parking,district:property.district,province:property.province,
                sector:property.sector,amenities:property.amenities,ownerId:property.ownerId,organizationId:property.organizationId,
                propertyStatus:property.status,location:{lat:property.latitude,lon:property.longitude}
              });
              if(!ok)throw new Error("OpenSearch unavailable");
            }
          }
        }
        await this.db.query("UPDATE background_jobs SET status='DONE',updated_at=now(),finished_at=now(),locked_at=NULL WHERE id=$1",[job.id]);
      }catch(error){
        this.log.error("Job "+job.id+" failed: "+String(error));
        await this.db.query(
          "UPDATE background_jobs SET status=CASE WHEN attempts>=5 THEN 'FAILED' ELSE 'PENDING' END,run_at=now()+interval '10 seconds',updated_at=now(),locked_at=NULL,last_error=$2 WHERE id=$1",
          [job.id,String(error)],
        );
      }
    }
  }
}
