import { Injectable } from "@nestjs/common";
import { randomUUID } from "crypto";
import { DatabaseService } from "./database.service";

@Injectable()
export class FeatureService {
  constructor(private readonly db: DatabaseService) {}

  async notify(userId:string,eventType:string,title:string,body:string){
    return this.db.query("INSERT INTO notifications(id,user_id,channel,event_type,title,body) VALUES($1,$2,'in_app',$3,$4,$5) RETURNING *",[randomUUID(),userId,eventType,title,body]).then((r)=>r.rows[0]);
  }
  async audit(actorId:string|undefined,action:string,subjectType:string,subjectId?:string,before?:unknown,after?:unknown){
    await this.db.query("INSERT INTO audit_logs(actor_id,action,subject_type,subject_id,before,after) VALUES($1,$2,$3,$4,$5::jsonb,$6::jsonb)",[actorId ?? null,action,subjectType,subjectId ?? null,before==null?null:JSON.stringify(before),after==null?null:JSON.stringify(after)]);
  }
  async track(name:string,userId?:string,propertyId?:string,payload:Record<string,unknown>={}){
    await this.db.query("INSERT INTO analytics_events(name,user_id,property_id,payload) VALUES($1,$2,$3,$4::jsonb)",[name,userId ?? null,propertyId ?? null,JSON.stringify(payload)]);
  }

  async saveSearch(userId:string,name:string,criteria:Record<string,unknown>) {
    return this.db.query(
      "INSERT INTO saved_searches(id,user_id,name,criteria) VALUES($1,$2,$3,$4::jsonb) RETURNING *",
      [randomUUID(),userId,name,JSON.stringify(criteria)],
    ).then((r)=>r.rows[0]);
  }

  async listSavedSearches(userId:string) {
    return this.db.query("SELECT * FROM saved_searches WHERE user_id=$1 ORDER BY created_at DESC",[userId]).then((r)=>r.rows);
  }

  async listNotifications(userId:string) {
    return this.db.query("SELECT * FROM notifications WHERE user_id=$1 ORDER BY created_at DESC",[userId]).then((r)=>r.rows);
  }

  async readAllNotifications(userId:string) {
    await this.db.query("UPDATE notifications SET read_at=now() WHERE user_id=$1 AND read_at IS NULL",[userId]);
    return {ok:true};
  }

  async favorites(userId:string) {
    const rows=await this.db.query("SELECT property_id FROM favorites WHERE user_id=$1 ORDER BY created_at DESC",[userId]);
    return (await Promise.all(rows.rows.map((x)=>this.db.hydrateProperty(x.property_id)))).filter(Boolean);
  }

  async favoriteAdd(userId:string,propertyId:string) {
    const property=await this.db.getProperty(propertyId);
    if(!property) return {error:"not_found"};
    await this.db.query("INSERT INTO favorites(user_id,property_id) VALUES($1,$2) ON CONFLICT DO NOTHING",[userId,propertyId]);
    await this.track("property_saved",userId,propertyId);
    return {saved:true};
  }

  async favoriteRemove(userId:string,propertyId:string) {
    await this.db.query("DELETE FROM favorites WHERE user_id=$1 AND property_id=$2",[userId,propertyId]);
    return {saved:false};
  }

  async conversation(userId:string,recipientId:string|undefined,propertyId?:string,bookingId?:string,offerId?:string) {
    const memberIds=[userId,recipientId].filter(Boolean) as string[];
    if(memberIds.length<2) throw new Error("recipientId is required");
    const existing=await this.db.query(
      "SELECT c.id FROM conversations c " +
      "WHERE ($2::uuid IS NULL OR c.property_id=$2) AND ($3::uuid IS NULL OR c.booking_id=$3) " +
      "AND (SELECT COUNT(*) FROM conversation_members x WHERE x.conversation_id=c.id AND x.user_id=ANY($1::uuid[]))=cardinality($1::uuid[]) " +
      "AND (SELECT COUNT(*) FROM conversation_members x WHERE x.conversation_id=c.id)=cardinality($1::uuid[]) LIMIT 1",
      [memberIds,propertyId ?? null,bookingId ?? null],
    );
    if(existing.rows[0]) return String(existing.rows[0].id);
    const id=randomUUID();
    await this.db.transaction(async(client)=>{
      await client.query("INSERT INTO conversations(id,property_id,booking_id,offer_id) VALUES($1,$2,$3,$4)",[id,propertyId ?? null,bookingId ?? null,offerId ?? null]);
      for(const member of memberIds) await client.query("INSERT INTO conversation_members(conversation_id,user_id) VALUES($1,$2)",[id,member]);
    });
    return id;
  }

  async listConversations(userId:string) {
    const result=await this.db.query(
      "SELECT c.id,c.property_id,c.booking_id,c.offer_id,c.created_at,ARRAY_AGG(cm.user_id) member_ids " +
      "FROM conversations c JOIN conversation_members cm ON cm.conversation_id=c.id " +
      "WHERE EXISTS(SELECT 1 FROM conversation_members me WHERE me.conversation_id=c.id AND me.user_id=$1) " +
      "GROUP BY c.id ORDER BY c.created_at DESC",
      [userId],
    );
    return result.rows.map((x)=>({id:x.id,propertyId:x.property_id,bookingId:x.booking_id,offerId:x.offer_id,memberIds:x.member_ids,createdAt:x.created_at}));
  }

  async getConversation(userId:string,id:string) {
    const result=await this.db.query(
      "SELECT c.id,c.property_id,c.booking_id,c.offer_id,c.created_at,ARRAY_AGG(cm.user_id) member_ids " +
      "FROM conversations c JOIN conversation_members cm ON cm.conversation_id=c.id WHERE c.id=$1 " +
      "AND EXISTS(SELECT 1 FROM conversation_members me WHERE me.conversation_id=c.id AND me.user_id=$2) GROUP BY c.id",
      [id,userId],
    );
    if(!result.rows[0]) return undefined;
    const x=result.rows[0];
    const messages=await this.db.query("SELECT * FROM messages WHERE conversation_id=$1 ORDER BY created_at ASC",[id]);
    return {conversation:{id:x.id,propertyId:x.property_id,bookingId:x.booking_id,offerId:x.offer_id,memberIds:x.member_ids,createdAt:x.created_at},messages:messages.rows};
  }

  async sendMessage(userId:string,input:{conversationId?:string;recipientId?:string;propertyId?:string;bookingId?:string;offerId?:string;body:string}) {
    const conversationId=input.conversationId ?? await this.conversation(userId,input.recipientId,input.propertyId,input.bookingId,input.offerId);
    const allowed=await this.db.query(
      "SELECT 1 FROM conversation_members WHERE conversation_id=$1 AND user_id=$2",
      [conversationId,userId],
    );
    if(!allowed.rows[0]) return {error:"forbidden"};
    const id=randomUUID();
    const result=await this.db.query(
      "INSERT INTO messages(id,conversation_id,sender_id,body,status) VALUES($1,$2,$3,$4,'SENT') RETURNING *",
      [id,conversationId,userId,input.body],
    );
    const members=await this.db.query("SELECT user_id FROM conversation_members WHERE conversation_id=$1 AND user_id<>$2",[conversationId,userId]);
    for(const row of members.rows) await this.notify(row.user_id,"NEW_MESSAGE","New message",input.body.slice(0,80));
    return result.rows[0];
  }

  async markRead(userId:string,conversationId:string) {
    const allowed=await this.db.query("SELECT 1 FROM conversation_members WHERE conversation_id=$1 AND user_id=$2",[conversationId,userId]);
    if(!allowed.rows[0]) return {error:"forbidden"};
    await this.db.query("UPDATE messages SET status='READ' WHERE conversation_id=$1 AND sender_id<>$2",[conversationId,userId]);
    return {ok:true};
  }

  async createReview(userId:string,bookingId:string,rating:number,body:string) {
    if(rating<1||rating>5) return {error:"invalid_rating"};
    const result=await this.db.query(
      "INSERT INTO reviews(booking_id,reviewer_id,property_id,rating,body) " +
      "SELECT b.id,$2,pl.property_id,$3,$4 FROM bookings b JOIN property_listings pl ON pl.id=b.listing_id " +
      "WHERE b.id=$1 AND b.tenant_id=$2 AND b.status IN('CONFIRMED','ACTIVE','COMPLETED') " +
      "ON CONFLICT(booking_id) DO NOTHING RETURNING *",
      [bookingId,userId,rating,body],
    );
    return result.rows[0] ?? {error:"review_requires_transaction"};
  }

  async reviews(propertyId:string) {
    return this.db.query("SELECT * FROM reviews WHERE property_id=$1 ORDER BY created_at DESC",[propertyId]).then((r)=>r.rows);
  }

  async submitVerification(userId:string,input:{subjectType:string;subjectId:string;kind:string;evidence?:unknown}) {
    const id=randomUUID();
    const result=await this.db.query(
      "INSERT INTO verification_requests(id,subject_type,subject_id,kind,status,evidence) VALUES($1,$2,$3,$4,'UNDER_REVIEW',$5::jsonb) RETURNING *",
      [id,input.subjectType,input.subjectId,input.kind,JSON.stringify(input.evidence ?? {})],
    );
    await this.audit(userId,"VERIFICATION_SUBMITTED",input.subjectType,input.subjectId);
    return result.rows[0];
  }

  async decideVerification(actorId:string,id:string,accept:boolean) {
    const result=await this.db.transaction(async(client)=>{
      const existing=await client.query("SELECT * FROM verification_requests WHERE id=$1 FOR UPDATE",[id]);
      if(!existing.rows[0]) return undefined;
      const status=accept?"VERIFIED":"REJECTED";
      const updated=await client.query("UPDATE verification_requests SET status=$2,reviewer_id=$3,updated_at=now() WHERE id=$1 RETURNING *",[id,status,actorId]);
      if(existing.rows[0].subject_type==="property" && accept) {
        await client.query("UPDATE properties SET verification_status='VERIFIED',updated_at=now() WHERE id=$1",[existing.rows[0].subject_id]);
      }
      return updated.rows[0];
    });
    if(result) await this.audit(actorId,accept?"PROPERTY_VERIFIED":"VERIFICATION_REJECTED",String(result.subject_type),String(result.subject_id),{status:"UNDER_REVIEW"},{status:result.status});
    return result ?? {error:"not_found"};
  }

  async listVerifications() {
    return this.db.query("SELECT * FROM verification_requests ORDER BY created_at DESC").then((r)=>r.rows);
  }

  async createOffer(userId:string,input:{listingId:string;amountMinor:number;currency:string;message?:string}) {
    const listing=await this.db.getListing(input.listingId);
    if(!listing || listing.listingType!=="SALE") return {error:"sale_listing_required"};
    const result=await this.db.query(
      "INSERT INTO offers(id,listing_id,buyer_id,amount_minor,currency,status,message) VALUES($1,$2,$3,$4,$5,'SELLER_REVIEWING',$6) RETURNING *",
      [randomUUID(),input.listingId,userId,input.amountMinor,input.currency,input.message ?? null],
    );
    return result.rows[0];
  }

  async respondOffer(userId:string,id:string,action:"ACCEPT"|"REJECT"|"COUNTER",amountMinor?:number) {
    const offer=await this.db.query(
      "SELECT o.*,p.owner_id FROM offers o JOIN property_listings pl ON pl.id=o.listing_id JOIN properties p ON p.id=pl.property_id WHERE o.id=$1",[id],
    );
    if(!offer.rows[0]) return {error:"not_found"};
    const row=offer.rows[0];
    if(row.buyer_id!==userId && row.owner_id!==userId) return {error:"forbidden"};
    const status=action==="COUNTER"?"COUNTERED":action==="ACCEPT"?"ACCEPTED":"REJECTED";
    const updated=await this.db.query("UPDATE offers SET status=$2,amount_minor=COALESCE($3,amount_minor),updated_at=now() WHERE id=$1 RETURNING *",[id,status,amountMinor ?? null]);
    return updated.rows[0];
  }

  async listOffers(userId:string) {
    return this.db.query(
      "SELECT o.* FROM offers o JOIN property_listings pl ON pl.id=o.listing_id JOIN properties p ON p.id=pl.property_id " +
      "WHERE o.buyer_id=$1 OR p.owner_id=$1 ORDER BY o.created_at DESC",
      [userId],
    ).then((r)=>r.rows);
  }

  async viewingSlots(listingId:string) {
    const rows=await this.db.query("SELECT slot_start FROM viewing_appointments WHERE listing_id=$1 AND status<>'DECLINED'",[listingId]);
    const taken=new Set(rows.rows.map((x)=>new Date(x.slot_start).toISOString()));
    const hours=[9,10,11,14,16];
    const day=new Date();
    day.setDate(day.getDate()+((6-day.getDay()+7)%7||7));
    return hours.map((h)=>{const d=new Date(day);d.setHours(h,0,0,0);const slotStart=d.toISOString();return{slotStart,available:!taken.has(slotStart)};});
  }

  async requestViewing(userId:string,listingId:string,slotStart:string) {
    const duplicate=await this.db.query("SELECT 1 FROM viewing_appointments WHERE listing_id=$1 AND slot_start=$2::timestamptz AND status IN('REQUESTED','CONFIRMED')",[listingId,slotStart]);
    if(duplicate.rows[0]) return {error:"slot_unavailable"};
    const result=await this.db.query(
      "INSERT INTO viewing_appointments(id,listing_id,requester_id,slot_start,slot_end,status) VALUES($1,$2,$3,$4::timestamptz,$5::timestamptz,'REQUESTED') RETURNING *",
      [randomUUID(),listingId,userId,slotStart,new Date(new Date(slotStart).getTime()+3600000).toISOString()],
    );
    await this.track("viewing_requested",userId,undefined,result.rows[0]);
    return result.rows[0];
  }

  async decideViewing(userId:string,id:string,accept:boolean) {
    const check=await this.db.query("SELECT va.*,p.owner_id FROM viewing_appointments va JOIN property_listings pl ON pl.id=va.listing_id JOIN properties p ON p.id=pl.property_id WHERE va.id=$1",[id]);
    if(!check.rows[0]) return {error:"not_found"};
    if(check.rows[0].owner_id!==userId) return {error:"forbidden"};
    const status=accept?"CONFIRMED":"DECLINED";
    const result=await this.db.query("UPDATE viewing_appointments SET status=$2 WHERE id=$1 RETURNING *",[id,status]);
    await this.notify(result.rows[0].requester_id,"VIEWING_UPDATED","Viewing update",status);
    return result.rows[0];
  }

  async leases(userId:string) {
    return this.db.query(
      "SELECT ra.* FROM rental_agreements ra JOIN bookings b ON b.id=ra.booking_id WHERE b.tenant_id=$1 ORDER BY ra.created_at DESC",
      [userId],
    ).then((r)=>r.rows);
  }

  async lease(id:string) {
    return this.db.query("SELECT * FROM rental_agreements WHERE id=$1",[id]).then((r)=>r.rows[0]);
  }

  async createMaintenance(userId:string,input:{propertyId:string;title:string;description:string}) {
    const property=await this.db.getProperty(input.propertyId);
    if(!property) return {error:"not_found"};
    const result=await this.db.query(
      "INSERT INTO maintenance_requests(id,property_id,tenant_id,title,description,status) VALUES($1,$2,$3,$4,$5,'OPEN') RETURNING *",
      [randomUUID(),input.propertyId,userId,input.title,input.description],
    );
    await this.notify(property.ownerId,"MAINTENANCE_OPEN","Maintenance request",input.title);
    return result.rows[0];
  }

  async maintenance(userId:string) {
    return this.db.query(
      "SELECT mr.* FROM maintenance_requests mr JOIN properties p ON p.id=mr.property_id WHERE mr.tenant_id=$1 OR p.owner_id=$1 ORDER BY mr.created_at DESC",
      [userId],
    ).then((r)=>r.rows);
  }

  async updateMaintenance(userId:string,id:string,status:string) {
    const check=await this.db.query("SELECT mr.*,p.owner_id FROM maintenance_requests mr JOIN properties p ON p.id=mr.property_id WHERE mr.id=$1",[id]);
    if(!check.rows[0]) return {error:"not_found"};
    if(check.rows[0].owner_id!==userId) return {error:"forbidden"};
    return this.db.query("UPDATE maintenance_requests SET status=$2 WHERE id=$1 RETURNING *",[id,status]).then((r)=>r.rows[0]);
  }

  async track(name:string,userId?:string,propertyId?:string,payload:Record<string,unknown>={}) {
    await this.track(name,userId,propertyId,payload);
    return {ok:true};
  }

  async platformAnalytics() {
    const [activeListings,properties,searches,bookings,gmv]=await Promise.all([
      this.db.count("property_listings","status='ACTIVE'"),
      this.db.count("properties","TRUE"),
      this.db.count("analytics_events","name='search_performed'"),
      this.db.count("bookings","TRUE"),
      this.db.query("SELECT COALESCE(SUM(amount_minor),0)::bigint total FROM bookings WHERE status IN('CONFIRMED','ACTIVE','COMPLETED')"),
    ]);
    return {activeListings,properties,searches,bookings,gmv:Number(gmv.rows[0].total)};
  }

  async landlordAnalytics(userId:string) {
    const propertyIds=await this.db.query("SELECT id FROM properties WHERE owner_id=$1",[userId]);
    const ids=propertyIds.rows.map((x)=>x.id);
    const [properties,active,forSale,views,bookings,inq]=await Promise.all([
      ids.length, this.db.count("properties","owner_id=$1 AND status='PUBLISHED'",[userId]),
      this.db.count("property_listings","listing_type='SALE' AND property_id=ANY($1::uuid[])",[ids]),
      this.db.count("property_views","property_id=ANY($1::uuid[])",[ids]),
      this.db.query("SELECT COUNT(*)::int count,COALESCE(SUM(amount_minor),0)::bigint revenue,COUNT(*) FILTER(WHERE status IN('ACTIVE','CONFIRMED'))::int rented FROM bookings WHERE listing_id IN(SELECT id FROM property_listings WHERE property_id=ANY($1::uuid[]))",[ids]),
      this.db.count("conversation_members","user_id=$1",[userId]),
    ]);
    const b=bookings.rows[0];
    return {properties,active,rented:Number(b.rented),forSale,views,inquiries:inq,bookings:Number(b.count),revenue:Number(b.revenue)};
  }

  async privacyExport(userId:string) {
    const [bookings,favorites,consents,messages]=await Promise.all([
      this.db.query("SELECT * FROM bookings WHERE tenant_id=$1",[userId]),
      this.db.query("SELECT property_id FROM favorites WHERE user_id=$1",[userId]),
      this.db.query("SELECT * FROM consent_records WHERE user_id=$1",[userId]),
      this.db.query("SELECT * FROM messages WHERE sender_id=$1",[userId]),
    ]);
    return {bookings:bookings.rows,favorites:favorites.rows.map((x)=>x.property_id),consents:consents.rows,messages:messages.rows};
  }

  async deleteAccount(userId:string) {
    await this.db.query("UPDATE users SET status='PENDING_DELETION',email='deleted-'||id||'@imizi.invalid',phone='deleted-'||id,updated_at=now() WHERE id=$1",[userId]);
    await this.audit(userId,"ACCOUNT_DELETE_REQUESTED","user",userId);
    return {status:"scheduled"};
  }

  async agencies() { return this.db.query("SELECT o.*,COALESCE(ARRAY_AGG(om.user_id),'{}') members FROM organizations o LEFT JOIN organization_members om ON om.organization_id=o.id GROUP BY o.id ORDER BY o.created_at DESC").then((r)=>r.rows); }

  async agencyDashboard(userId:string) {
    const org=await this.db.query("SELECT o.id,o.name,o.slug,o.kind,ARRAY_AGG(om.user_id) members FROM organizations o JOIN organization_members om ON om.organization_id=o.id WHERE EXISTS(SELECT 1 FROM organization_members x WHERE x.organization_id=o.id AND x.user_id=$1) GROUP BY o.id",[userId]);
    if(!org.rows[0]) return {error:"not_an_agent"};
    const id=org.rows[0].id;
    const [properties,bookings,leads]=await Promise.all([
      this.db.count("properties","organization_id=$1",[id]),
      this.db.query("SELECT COUNT(*)::int count,COALESCE(SUM(amount_minor),0)::bigint revenue FROM bookings WHERE listing_id IN(SELECT id FROM property_listings WHERE property_id IN(SELECT id FROM properties WHERE organization_id=$1))",[id]),
      this.db.count("conversation_members","user_id=ANY($1::uuid[])",[org.rows[0].members]),
    ]);
    return {agency:org.rows[0],properties,agents:org.rows[0].members.length,leads,bookings:Number(bookings.rows[0].count),revenue:Number(bookings.rows[0].revenue)};
  }

  async createAgency(userId:string,name:string,slug:string) {
    return this.db.transaction(async(client)=>{
      const org=await client.query("INSERT INTO organizations(name,slug,kind) VALUES($1,$2,'AGENCY') RETURNING *",[name,slug]);
      await client.query("INSERT INTO organization_members(organization_id,user_id,role) VALUES($1,$2,'AGENCY_ADMIN') ON CONFLICT DO NOTHING",[org.rows[0].id,userId]);
      await client.query("UPDATE users SET organization_id=$2 WHERE id=$1",[userId,org.rows[0].id]);
      await client.query("INSERT INTO user_roles(user_id,role) VALUES($1,'AGENCY_ADMIN') ON CONFLICT DO NOTHING",[userId]);
      return {...org.rows[0],members:[userId]};
    });
  }

  async adminOverview() {
    const [users,properties,listings,agencies,bookings,payments,refunds,reports,verificationQueue,fraud,reviews,messages,gmv,paid,views]=await Promise.all([
      this.db.count("users","TRUE"),this.db.count("properties","TRUE"),this.db.count("property_listings","TRUE"),this.db.count("organizations","TRUE"),
      this.db.count("bookings","TRUE"),this.db.count("payment_intents","TRUE"),this.db.count("payment_refunds","TRUE"),this.db.count("reports","TRUE"),
      this.db.count("verification_requests","status='UNDER_REVIEW'"),this.db.count("fraud_cases","TRUE"),this.db.count("reviews","TRUE"),this.db.count("messages","TRUE"),
      this.db.query("SELECT COALESCE(SUM(amount_minor),0)::bigint total FROM bookings WHERE status IN('CONFIRMED','ACTIVE','COMPLETED')"),
      this.db.query("SELECT COALESCE(SUM(amount_minor),0)::bigint total FROM payment_intents WHERE status='SUCCEEDED'"),
      this.db.count("property_views","TRUE"),
    ]);
    const dau=await this.db.query("SELECT COUNT(DISTINCT user_id)::int count FROM analytics_events WHERE user_id IS NOT NULL AND created_at>=now()-interval '1 day'");
    return {users,properties,listings,agencies,bookings,payments,refunds,reports,verificationQueue,fraud,reviews,messages,gmv:Number(gmv.rows[0].total),paidVolume:Number(paid.rows[0].total),dau:Number(dau.rows[0].count),mau:users,conversion:bookings/Math.max(1,views)};
  }

  async adminUsers(){return this.db.query("SELECT u.id,u.email,u.full_name,u.status,COALESCE(ARRAY_AGG(ur.role) FILTER(WHERE ur.role IS NOT NULL),'{}') roles FROM users u LEFT JOIN user_roles ur ON ur.user_id=u.id GROUP BY u.id ORDER BY u.created_at DESC").then((r)=>r.rows);}
  async adminProperties(){const ids=await this.db.query("SELECT id FROM properties ORDER BY updated_at DESC LIMIT 500");return Promise.all(ids.rows.map((x)=>this.db.hydrateProperty(x.id)));}
  async adminModeration(){
    const [fraud,reports,verifications]=await Promise.all([
      this.db.query("SELECT * FROM fraud_cases ORDER BY created_at DESC LIMIT 500"),
      this.db.query("SELECT * FROM reports ORDER BY created_at DESC LIMIT 500"),
      this.db.query("SELECT * FROM verification_requests ORDER BY created_at DESC LIMIT 500"),
    ]);
    return {fraud:fraud.rows,reports:reports.rows,verifications:verifications.rows};
  }

  async report(userId:string,body:{subjectType:string;subjectId:string;reason:string}){
    const result=await this.db.query(
      "INSERT INTO reports(id,reporter_id,subject_type,subject_id,reason) VALUES($1,$2,$3,$4,$5) RETURNING *",
      [randomUUID(),userId,body.subjectType,body.subjectId,body.reason],
    );
    return result.rows[0];
  }

  async setRisk(userId:string,id:string,level:string){
    const property=await this.db.getProperty(id);if(!property)return{error:"not_found"};
    const updated=await this.db.setPropertyRisk(id,level as any);
    await this.audit(userId,"RISK_UPDATED","property",id,{riskLevel:property.riskLevel},{riskLevel:level});
    return updated;
  }

  async recommendations(userId?:string){
    if(!userId)return this.db.searchListings({limit:8});
    const views=await this.db.query("SELECT property_id FROM property_views WHERE user_id=$1 ORDER BY created_at DESC LIMIT 20",[userId]);
    const first=views.rows[0] ? await this.db.getProperty(views.rows[0].property_id) : undefined;
    return this.db.searchListings({district:first?.district,propertyType:first?.propertyType,limit:8});
  }

  async compare(){const rows=await this.db.query("SELECT id,property_id FROM property_listings WHERE status='ACTIVE' ORDER BY created_at DESC LIMIT 4");return Promise.all(rows.rows.map(async(x)=>({listing:await this.db.getListing(x.id),property:await this.db.getProperty(x.property_id)})));}

  async addMedia(propertyId:string,kind:string,key:string){return this.db.addMedia(propertyId,kind,key);}
}
