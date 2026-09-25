import { ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { scoreFraud, shouldQueueForModeration } from "@imizi/domain";
import { UserRecord, PropertyRecord } from "../../store/platform.store";
import { assertPermission, assertPropertyAccess } from "../../common/access";
import { DatabaseService } from "../../infra/database.service";

@Injectable()
export class PropertiesService {
  constructor(private readonly db: DatabaseService) {}

  async create(user: UserRecord, input: Record<string, any>) {
    assertPermission(user, "property:create");
    const recent = await this.db.count("properties", "owner_id=$1 AND created_at >= now()-interval '24 hours'", [user.id]);
    const fraud = scoreFraud({
      listingsLast24h: recent, duplicatePhotoHits: 0, priceVsMedianRatio: 1, reportCount: 0,
      accountsFromSameDeviceLastHour: 0, paymentAnomalyScore: 0, fakeContactScore: 0,
      duplicatePropertyScore: 0, locationMismatchScore: 0,
    });
    const property = await this.db.createProperty(input, user.id, input.organizationId ?? user.organizationId, fraud);
    if (!property) throw new NotFoundException();
    if (shouldQueueForModeration(fraud.level)) {
      await this.db.query("INSERT INTO fraud_cases(subject_type,subject_id,risk_level,score,signals) VALUES('property',$1,$2,$3,$4::jsonb)", [property.id,fraud.level,fraud.score,JSON.stringify(fraud)]);
    }
    await this.db.auditLog(user.id,"PROPERTY_CREATED","property",property.id);
    return this.db.hydrateProperty(property.id);
  }

  async get(id: string, user?: UserRecord) {
    const property = await this.db.getProperty(id);
    if (!property) throw new NotFoundException("Property not found");
    assertPropertyAccess(user, property, false);
    await this.db.insertView(id, user?.id);
    await this.db.trackEvent("property_viewed", user?.id, id);
    return this.db.hydrateProperty(id);
  }

  async update(id:string,user:UserRecord,patch:Record<string,any>) {
    const property=await this.db.getProperty(id);
    if(!property) throw new NotFoundException();
    assertPropertyAccess(user,property,true);
    const result=await this.db.updateProperty(id,patch);
    await this.db.auditLog(user.id,"PROPERTY_UPDATED","property",id,undefined,patch);
    return result;
  }

  async publish(id:string,user:UserRecord) {
    const property=await this.db.getProperty(id);
    if(!property) throw new NotFoundException();
    assertPropertyAccess(user,property,true);
    if(property.riskLevel==="BLOCKED") throw new ForbiddenException("Listing is blocked pending review");
    const result=await this.db.publishProperty(id);
    for(const saved of await this.db.findMatchingSavedSearches(id)) {
      await this.db.notify(saved.user_id,"NEW_MATCHING_PROPERTY","New property matching your search",property.title);
    }
    await this.db.auditLog(user.id,"PROPERTY_PUBLISHED","property",id);
    return result;
  }

  async owned(user:UserRecord){ return this.db.listOwnedProperties(user.id,user.organizationId); }

  async addUnit(id:string,user:UserRecord,input:{label:string;bedrooms?:number}){
    const property=await this.db.getProperty(id);
    if(!property) throw new NotFoundException();
    assertPropertyAccess(user,property,true);
    return this.db.addUnit(id,{label:input.label,bedrooms:input.bedrooms,bathrooms:1,parking:0});
  }
}
