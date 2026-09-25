import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from "@nestjs/common";
import { Pool, PoolClient } from "pg";
import { randomUUID } from "crypto";
import { loadConfig } from "@imizi/config";
import type { Role, RiskLevel } from "@imizi/types";
import { matchesSavedSearch } from "@imizi/domain";
import type { UserRecord, PropertyRecord, ListingRecord, BookingRecord, PaymentIntentRecord } from "../store/platform.store";

@Injectable()
export class DatabaseService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(DatabaseService.name);
  private readonly pool: Pool;

  constructor() {
    const config = loadConfig();
    if (!config.databaseUrl) throw new Error("DATABASE_URL is required");
    this.pool = new Pool({
      connectionString: config.databaseUrl,
      max: Number(process.env.DB_POOL_MAX ?? 20),
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000,
      maxUses: 5000,
    });
  }

  async onModuleInit() {
    await this.pool.query("SELECT 1");
    this.logger.log("PostgreSQL connected");
  }

  async onModuleDestroy() {
    await this.pool.end();
  }

  async query<T = any>(text: string, values: readonly unknown[] = []) {
    return this.pool.query<T>(text, values as any);
  }

  async transaction<T>(work: (client: PoolClient) => Promise<T>) {
    const client = await this.pool.connect();
    try {
      await client.query("BEGIN");
      const result = await work(client);
      await client.query("COMMIT");
      return result;
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }

  async findUserByIdentifier(identifier: string) {
    const result = await this.query(
      "SELECT u.*, COALESCE(array_agg(ur.role) FILTER (WHERE ur.role IS NOT NULL), '{}') AS roles " +
      "FROM users u LEFT JOIN user_roles ur ON ur.user_id = u.id " +
      "WHERE lower(u.email::text)=lower($1) OR u.phone=$1 GROUP BY u.id LIMIT 1",
      [identifier],
    );
    return result.rows[0] ? this.mapUser(result.rows[0]) : undefined;
  }

  async findUserById(id: string) {
    const result = await this.query(
      "SELECT u.*, COALESCE(array_agg(ur.role) FILTER (WHERE ur.role IS NOT NULL), '{}') AS roles " +
      "FROM users u LEFT JOIN user_roles ur ON ur.user_id = u.id " +
      "WHERE u.id=$1 GROUP BY u.id",
      [id],
    );
    return result.rows[0] ? this.mapUser(result.rows[0]) : undefined;
  }

  async createUser(input: {
    id: string; email: string; phone: string; passwordHash: string; fullName: string;
    locale: string; roles: Role[]; organizationId?: string;
  }) {
    return this.transaction(async (client) => {
      await client.query(
        "INSERT INTO users(id,email,phone,password_hash,full_name,locale,organization_id) " +
        "VALUES($1,$2,$3,$4,$5,$6,$7)",
        [input.id,input.email,input.phone,input.passwordHash,input.fullName,input.locale,input.organizationId ?? null],
      );
      for (const role of input.roles) {
        await client.query("INSERT INTO user_roles(user_id,role) VALUES($1,$2) ON CONFLICT DO NOTHING", [input.id,role]);
      }
      await client.query("INSERT INTO consent_records(user_id,purpose,granted) VALUES($1,'account-creation',TRUE)", [input.id]);
      const user = await client.query(
        "SELECT u.*, ARRAY_AGG(ur.role) FILTER (WHERE ur.role IS NOT NULL) AS roles " +
        "FROM users u LEFT JOIN user_roles ur ON ur.user_id=u.id WHERE u.id=$1 GROUP BY u.id",
        [input.id],
      );
      return this.mapUser(user.rows[0]);
    });
  }

  async updateUser(user: UserRecord) {
    await this.transaction(async (client) => {
      await client.query(
        "UPDATE users SET email=$2,phone=$3,full_name=$4,locale=$5,status=$6,mfa_enabled=$7,organization_id=$8,updated_at=now() WHERE id=$1",
        [user.id,user.email,user.phone,user.fullName,user.locale,user.status,user.mfaEnabled,user.organizationId ?? null],
      );
      await client.query("DELETE FROM user_roles WHERE user_id=$1", [user.id]);
      for (const role of user.roles) {
        await client.query("INSERT INTO user_roles(user_id,role) VALUES($1,$2)", [user.id,role]);
      }
    });
    return user;
  }

  async createSession(userId: string, refreshHash: string, expiresAt: number, userAgent?: string, ip?: string) {
    await this.query(
      "INSERT INTO sessions(user_id,refresh_token_hash,user_agent,ip,expires_at) VALUES($1,$2,$3,$4,to_timestamp($5/1000.0))",
      [userId,refreshHash,userAgent ?? null,ip ?? null,expiresAt],
    );
  }

  async revokeAllSessions(userId:string){
    await this.query("UPDATE sessions SET revoked_at=now() WHERE user_id=$1 AND revoked_at IS NULL",[userId]);
  }

  async consumeRefreshToken(refreshHash: string) {
    const result = await this.query(
      "DELETE FROM sessions WHERE refresh_token_hash=$1 AND revoked_at IS NULL AND expires_at>now() RETURNING user_id",
      [refreshHash],
    );
    return result.rows[0]?.user_id as string | undefined;
  }

  async createProperty(input: Record<string, any>, ownerId: string, organizationId: string | undefined, risk: { level: RiskLevel; score: number }) {
    const id = randomUUID();
    await this.transaction(async (client) => {
      await client.query(
        "INSERT INTO properties(id,owner_id,organization_id,title,description,property_type,status,country_code,verification_status,risk_level,risk_score,bedrooms,bathrooms,parking,area_value,area_unit) " +
        "VALUES($1,$2,$3,$4,$5,$6,'DRAFT',$7,'UNVERIFIED',$8,$9,$10,$11,$12,$13,$14)",
        [
          id,ownerId,organizationId ?? null,input.title,input.description,input.propertyType,input.countryCode ?? "RW",
          risk.level,risk.score,input.bedrooms ?? null,input.bathrooms ?? null,input.parking ?? null,
          input.areaValue ?? null,input.areaUnit ?? "SQM",
        ],
      );
      await client.query(
        "INSERT INTO property_locations(property_id,country_code,province,district,sector,cell,village,address_line,geom) " +
        "VALUES($1,$2,$3,$4,$5,$6,$7,$8,ST_SetSRID(ST_MakePoint($9,$10),4326)::geography)",
        [
          id,input.countryCode ?? "RW",input.province,input.district,input.sector ?? null,input.cell ?? null,input.village ?? null,
          input.addressLine ?? null,input.longitude,input.latitude,
        ],
      );
      for (const amenity of input.amenities ?? []) {
        await client.query(
          "INSERT INTO property_amenities(property_id,amenity) VALUES($1,$2) ON CONFLICT DO NOTHING",
          [id,String(amenity).toLowerCase()],
        );
      }
    });
    return this.getProperty(id);
  }

  async getProperty(id: string): Promise<PropertyRecord | undefined> {
    const base = await this.query(
      "SELECT p.*,pl.province,pl.district,pl.sector,pl.cell,pl.village, " +
      "ST_Y(pl.geom::geometry) latitude,ST_X(pl.geom::geometry) longitude " +
      "FROM properties p JOIN property_locations pl ON pl.property_id=p.id WHERE p.id=$1",
      [id],
    );
    if (!base.rows[0]) return undefined;
    const row = base.rows[0];
    const [amenities,media] = await Promise.all([
      this.query("SELECT amenity FROM property_amenities WHERE property_id=$1 ORDER BY amenity",[id]),
      this.query("SELECT id,kind,storage_key,sort_order FROM property_media WHERE property_id=$1 ORDER BY sort_order,id",[id]),
    ]);
    return {
      id:String(row.id),ownerId:String(row.owner_id),organizationId:row.organization_id ?? undefined,title:String(row.title),
      description:String(row.description),propertyType:String(row.property_type),status:row.status,countryCode:String(row.country_code),
      verificationStatus:String(row.verification_status),riskLevel:row.risk_level,riskScore:Number(row.risk_score),
      province:String(row.province),district:String(row.district),sector:row.sector ?? undefined,cell:row.cell ?? undefined,village:row.village ?? undefined,
      latitude:Number(row.latitude),longitude:Number(row.longitude),
      bedrooms:row.bedrooms == null ? undefined : Number(row.bedrooms),
      bathrooms:row.bathrooms == null ? undefined : Number(row.bathrooms),
      parking:row.parking == null ? undefined : Number(row.parking),
      areaValue:row.area_value == null ? undefined : Number(row.area_value),areaUnit:String(row.area_unit),
      amenities:amenities.rows.map((x:any)=>String(x.amenity)),
      media:media.rows.map((x:any)=>({id:String(x.id),kind:String(x.kind),url:String(x.storage_key).startsWith("http") ? String(x.storage_key) : "/cdn/"+String(x.storage_key),sortOrder:Number(x.sort_order)})),
      createdAt:new Date(row.created_at).toISOString(),updatedAt:new Date(row.updated_at).toISOString(),
    };
  }

  async hydrateProperty(id: string) {
    const property = await this.getProperty(id);
    if (!property) return undefined;
    const [units,listings,views] = await Promise.all([
      this.query("SELECT id,property_id,label,bedrooms,bathrooms,parking,status FROM property_units WHERE property_id=$1 ORDER BY label",[id]),
      this.query(
        "SELECT pl.id,pl.property_id,pl.unit_id,pl.listing_type,pl.status,pl.available_from,pl.created_at,pl.updated_at," +
        "COALESCE(pp.amount_minor,0) price_minor,COALESCE(pp.currency,'RWF') currency " +
        "FROM property_listings pl LEFT JOIN LATERAL " +
        "(SELECT amount_minor,currency FROM property_prices WHERE listing_id=pl.id AND effective_to IS NULL ORDER BY effective_from DESC LIMIT 1) pp ON TRUE " +
        "WHERE pl.property_id=$1 ORDER BY pl.created_at DESC",[id],
      ),
      this.query("SELECT COUNT(*)::int count FROM property_views WHERE property_id=$1",[id]),
    ]);
    return {
      ...property,
      units:units.rows.map((x:any)=>({id:String(x.id),propertyId:String(x.property_id),label:String(x.label),bedrooms:x.bedrooms == null ? undefined:Number(x.bedrooms),bathrooms:x.bathrooms == null ? undefined:Number(x.bathrooms),parking:x.parking == null ? undefined:Number(x.parking),status:String(x.status)})),
      listings:listings.rows.map((x:any)=>this.mapListing(x)),
      views:Number(views.rows[0].count),
      nearbyHint:{district:property.district,province:property.province},
    };
  }

  async listOwnedProperties(userId: string, organizationId?: string) {
    const ids = await this.query(
      "SELECT id FROM properties WHERE owner_id=$1 OR ($2::uuid IS NOT NULL AND organization_id=$2) ORDER BY updated_at DESC",
      [userId,organizationId ?? null],
    );
    return (await Promise.all(ids.rows.map((x:any)=>this.hydrateProperty(x.id)))).filter(Boolean);
  }

  async updateProperty(id: string, patch: Record<string, any>) {
    const allowed: Record<string,string> = {
      title:"title",description:"description",propertyType:"property_type",countryCode:"country_code",
      bedrooms:"bedrooms",bathrooms:"bathrooms",parking:"parking",areaValue:"area_value",areaUnit:"area_unit",
    };
    await this.transaction(async(client)=>{
      for (const [key,value] of Object.entries(patch)) {
        const column=allowed[key];
        if (!column) continue;
        await client.query("UPDATE properties SET "+column+"=$2,updated_at=now() WHERE id=$1",[id,value]);
      }
      if (["province","district","sector","cell","village","addressLine","latitude","longitude"].some((x)=>patch[x] !== undefined)) {
        const location=await client.query("SELECT province,district,sector,cell,village,address_line,ST_Y(geom::geometry) lat,ST_X(geom::geometry) lng FROM property_locations WHERE property_id=$1",[id]);
        const current=location.rows[0];
        const fields={
          province:patch.province ?? current?.province,district:patch.district ?? current?.district,sector:patch.sector ?? current?.sector,
          cell:patch.cell ?? current?.cell,village:patch.village ?? current?.village,addressLine:patch.addressLine ?? current?.address_line,
          latitude:patch.latitude ?? current?.lat,longitude:patch.longitude ?? current?.lng,
        };
        await client.query(
          "UPDATE property_locations SET province=$2,district=$3,sector=$4,cell=$5,village=$6,address_line=$7,geom=ST_SetSRID(ST_MakePoint($8,$9),4326)::geography WHERE property_id=$1",
          [id,fields.province,fields.district,fields.sector,fields.cell,fields.village,fields.addressLine,fields.longitude,fields.latitude],
        );
      }
      if (Array.isArray(patch.amenities)) {
        await client.query("DELETE FROM property_amenities WHERE property_id=$1",[id]);
        for (const amenity of patch.amenities) {
          await client.query("INSERT INTO property_amenities(property_id,amenity) VALUES($1,$2) ON CONFLICT DO NOTHING",[id,String(amenity).toLowerCase()]);
        }
      }
    });
    return this.hydrateProperty(id);
  }

  async publishProperty(id: string) {
    await this.query("UPDATE properties SET status='PUBLISHED',published_at=COALESCE(published_at,now()),updated_at=now() WHERE id=$1",[id]);
    return this.hydrateProperty(id);
  }

  async setPropertyRisk(id: string, level: RiskLevel) {
    await this.query("UPDATE properties SET risk_level=$2,updated_at=now() WHERE id=$1",[id,level]);
    return this.getProperty(id);
  }

  async setPropertyVerification(id: string,status: string) {
    await this.query("UPDATE properties SET verification_status=$2,updated_at=now() WHERE id=$1",[id,status]);
    return this.getProperty(id);
  }

  async addUnit(propertyId:string,input:{label:string;bedrooms?:number; bathrooms?:number;parking?:number}) {
    const id=randomUUID();
    const r=await this.query(
      "INSERT INTO property_units(id,property_id,label,bedrooms,bathrooms,parking,status) VALUES($1,$2,$3,$4,$5,$6,'AVAILABLE') RETURNING *",
      [id,propertyId,input.label,input.bedrooms ?? null,input.bathrooms ?? null,input.parking ?? 0],
    );
    return {id:r.rows[0].id,propertyId:r.rows[0].property_id,label:r.rows[0].label,bedrooms:r.rows[0].bedrooms,bathrooms:r.rows[0].bathrooms,parking:r.rows[0].parking,status:r.rows[0].status};
  }

  async createListing(input:{propertyId:string;unitId?:string;listingType:string;priceMinor:number;currency:string;availableFrom:string}) {
    const id=randomUUID();
    await this.transaction(async(client)=>{
      await client.query(
        "INSERT INTO property_listings(id,property_id,unit_id,listing_type,status,available_from) VALUES($1,$2,$3,$4,'ACTIVE',$5)",
        [id,input.propertyId,input.unitId ?? null,input.listingType,input.availableFrom],
      );
      await client.query(
        "INSERT INTO property_prices(listing_id,amount_minor,currency,period) VALUES($1,$2,$3,$4)",
        [id,input.priceMinor,input.currency,input.listingType==="RENT" ? "MONTH" : input.listingType==="SHORT_STAY" ? "NIGHT" : null],
      );
    });
    await this.enqueueJob("search.index",{listingId:id});
    return this.getListing(id);
  }

  async getListing(id:string):Promise<ListingRecord|undefined> {
    const r=await this.query(
      "SELECT pl.id,pl.property_id,pl.unit_id,pl.listing_type,pl.status,pl.available_from,pl.created_at,pl.updated_at,"+
      "COALESCE(pp.amount_minor,0) price_minor,COALESCE(pp.currency,'RWF') currency "+
      "FROM property_listings pl LEFT JOIN LATERAL "+
      "(SELECT amount_minor,currency FROM property_prices WHERE listing_id=pl.id AND effective_to IS NULL ORDER BY effective_from DESC LIMIT 1) pp ON TRUE "+
      "WHERE pl.id=$1",[id],
    );
    return r.rows[0] ? this.mapListing(r.rows[0]) : undefined;
  }

  async getUnit(id:string) {
    const r=await this.query("SELECT id,property_id,label,bedrooms,bathrooms,parking,status FROM property_units WHERE id=$1",[id]);
    if(!r.rows[0]) return undefined;
    const x=r.rows[0];
    return {id:String(x.id),propertyId:String(x.property_id),label:String(x.label),bedrooms:x.bedrooms == null ? undefined:Number(x.bedrooms),bathrooms:x.bathrooms == null ? undefined:Number(x.bathrooms),parking:x.parking == null ? undefined:Number(x.parking),status:String(x.status)};
  }

  async searchListings(query:{
    q?:string;listingType?:string;propertyType?:string;district?:string;province?:string;sector?:string;
    bedroomsMin?:number;bedroomsMax?:number;bathroomsMin?:number;minPriceMinor?:number;maxPriceMinor?:number;
    currency?:string;amenities?:string|string[];verifiedOnly?:boolean;availableFrom?:string;radiusKm?:number;
    lat?:number;lng?:number;north?:number;south?:number;east?:number;west?:number;limit:number;
  }) {
    const values:any[]=[query.q ?? ""];
    const where:string[]=["p.status='PUBLISHED'","pl.status='ACTIVE'"];
    const add=(sql:string,value:any)=>{values.push(value);where.push(sql.replace("?", "$"+values.length));};
    if(query.q) where.push("similarity(p.title || ' ' || p.description,$1)>0.02");
    if(query.listingType) add("pl.listing_type=? ",query.listingType);
    if(query.propertyType) add("p.property_type=? ",query.propertyType);
    if(query.province) add("LOWER(ploc.province)=LOWER(?) ",query.province);
    if(query.district) add("LOWER(ploc.district)=LOWER(?) ",query.district);
    if(query.sector) add("LOWER(ploc.sector)=LOWER(?) ",query.sector);
    if(query.bedroomsMin != null) add("COALESCE(p.bedrooms,0)>=? ",Number(query.bedroomsMin));
    if(query.bedroomsMax != null) add("COALESCE(p.bedrooms,999)<=? ",Number(query.bedroomsMax));
    if(query.bathroomsMin != null) add("COALESCE(p.bathrooms,0)>=? ",Number(query.bathroomsMin));
    if(query.minPriceMinor != null) add("COALESCE(pp.amount_minor,0)>=? ",Number(query.minPriceMinor));
    if(query.maxPriceMinor != null) add("COALESCE(pp.amount_minor,0)<=? ",Number(query.maxPriceMinor));
    if(query.currency) add("COALESCE(pp.currency,'RWF')=? ",query.currency);
    if(query.verifiedOnly) where.push("p.verification_status='VERIFIED'");
    if(query.availableFrom) add("pl.available_from<=?::timestamptz ",query.availableFrom);
    const amenities=Array.isArray(query.amenities) ? query.amenities : query.amenities ? String(query.amenities).split(",") : [];
    if(amenities.length){values.push(amenities.map((x:any)=>String(x).trim().toLowerCase()).filter(Boolean));const arrIndex=values.length;values.push(amenities.length);where.push("(SELECT COUNT(*) FROM property_amenities pa WHERE pa.property_id=p.id AND lower(pa.amenity)=ANY($"+arrIndex+"::text[]))=$"+values.length);}
    let distance="NULL::double precision distance_meters";
    if(query.lat != null && query.lng != null){
      values.push(Number(query.lng),Number(query.lat));const lng=values.length-1;const lat=values.length;
      distance="ST_Distance(ploc.geom,ST_SetSRID(ST_MakePoint($"+lng+",$"+lat+"),4326)::geography) distance_meters";
      if(query.radiusKm != null){values.push(Number(query.radiusKm));where.push("ST_DWithin(ploc.geom,ST_SetSRID(ST_MakePoint($"+lng+",$"+lat+"),4326)::geography,$"+values.length+"*1000)");}
    }
    if([query.north,query.south,query.east,query.west].every((x)=>x != null)){
      values.push(query.west,query.south,query.east,query.north);
      const w=values.length-3,s=values.length-2,e=values.length-1,n=values.length;
      where.push("ST_Intersects(ploc.geom::geometry,ST_MakeEnvelope($"+w+",$"+s+",$"+e+",$"+n+",4326))");
    }
    values.push(query.limit);
    const limit=values.length;
    const sql=
      "SELECT pl.id,pl.property_id,pl.unit_id,pl.listing_type,pl.status,pl.available_from,pl.created_at,pl.updated_at,"+
      "COALESCE(pp.amount_minor,0) price_minor,COALESCE(pp.currency,'RWF') currency,"+
      "p.title,p.description,p.property_type,p.verification_status,p.risk_level,p.risk_score,p.bedrooms,p.bathrooms,p.parking,p.area_value,p.area_unit,p.owner_id,p.organization_id,p.status property_status,p.country_code,"+
      "p.created_at property_created_at,p.updated_at property_updated_at,ploc.province,ploc.district,ploc.sector,ploc.cell,ploc.village,"+
      "ST_Y(ploc.geom::geometry) latitude,ST_X(ploc.geom::geometry) longitude,"+distance+","+
      "CASE WHEN $1='' THEN 0.5 ELSE similarity(p.title || ' ' || p.description,$1) END relevance "+
      "FROM property_listings pl JOIN properties p ON p.id=pl.property_id JOIN property_locations ploc ON ploc.property_id=p.id "+
      "LEFT JOIN LATERAL (SELECT amount_minor,currency FROM property_prices WHERE listing_id=pl.id AND effective_to IS NULL ORDER BY effective_from DESC LIMIT 1) pp ON TRUE "+
      "WHERE "+where.join(" AND ")+" ORDER BY relevance DESC,pl.created_at DESC,pl.id DESC LIMIT $"+limit;
    const result=await this.query(sql,values);
    return result.rows.map((x:any)=>({listing:this.mapListing(x),property:this.mapPropertyFromSearchRow(x),distanceMeters:x.distance_meters == null ? undefined : Math.round(Number(x.distance_meters)),score:Number(x.relevance)}));
  }

  async insertView(propertyId:string,userId?:string){await this.query("INSERT INTO property_views(property_id,user_id) VALUES($1,$2)",[propertyId,userId ?? null]);}

  async createBooking(input:{listingId:string;unitId?:string;tenantId:string;startDate:string;endDate:string;amountMinor:number;depositMinor:number;currency:string;idempotencyKey:string}) {
    return this.transaction(async(client)=>{
      const existing=await client.query("SELECT * FROM bookings WHERE idempotency_key=$1",[input.idempotencyKey]);
      if(existing.rows[0]) return this.mapBooking(existing.rows[0]);
      const r=await client.query(
        "INSERT INTO bookings(id,listing_id,unit_id,tenant_id,status,start_date,end_date,amount_minor,deposit_minor,currency,idempotency_key) "+
        "VALUES($1,$2,$3,$4,'PENDING',$5::date,$6::date,$7,$8,$9,$10) RETURNING *",
        [randomUUID(),input.listingId,input.unitId ?? null,input.tenantId,input.startDate,input.endDate,input.amountMinor,input.depositMinor,input.currency,input.idempotencyKey],
      );
      return this.mapBooking(r.rows[0]);
    });
  }

  async getBooking(id:string){const r=await this.query("SELECT * FROM bookings WHERE id=$1",[id]);return r.rows[0]?this.mapBooking(r.rows[0]):undefined;}

  async updateBookingStatus(id:string,status:string){const r=await this.query("UPDATE bookings SET status=$2,updated_at=now() WHERE id=$1 RETURNING *",[id,status]);return r.rows[0]?this.mapBooking(r.rows[0]):undefined;}

  async listBookingsForUser(userId:string,isAdmin=false){
    const r=await this.query(
      isAdmin
      ? "SELECT * FROM bookings ORDER BY created_at DESC"
      : "SELECT DISTINCT b.* FROM bookings b JOIN property_listings pl ON pl.id=b.listing_id JOIN properties p ON p.id=pl.property_id WHERE b.tenant_id=$1 OR p.owner_id=$1 OR p.organization_id=(SELECT organization_id FROM users WHERE id=$1) ORDER BY b.created_at DESC",
      isAdmin ? [] : [userId],
    );
    return r.rows.map((x:any)=>this.mapBooking(x));
  }

  async getPaymentByIdempotencyKey(key:string){
    const r=await this.query("SELECT * FROM payment_intents WHERE idempotency_key=$1",[key]);
    return r.rows[0] ? this.mapPayment(r.rows[0]) : undefined;
  }

  async createPaymentIntent(input:{id:string;bookingId:string;payerId:string;provider:string;amountMinor:number;currency:string;status:string;internalReference:string;idempotencyKey:string}){
    const r=await this.query(
      "INSERT INTO payment_intents(id,booking_id,payer_id,provider,amount_minor,currency,status,internal_reference,idempotency_key) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9) "+
      "ON CONFLICT(idempotency_key) DO NOTHING RETURNING *",
      [input.id,input.bookingId,input.payerId,input.provider,input.amountMinor,input.currency,input.status,input.internalReference,input.idempotencyKey],
    );
    if(r.rows[0]) return {created:true,intent:this.mapPayment(r.rows[0])};
    const existing=await this.getPaymentByIdempotencyKey(input.idempotencyKey);
    if(!existing) throw new Error("Payment idempotency race did not resolve");
    return {created:false,intent:existing};
  }

  async updatePaymentIntent(id:string,patch:{status?:string;providerReference?:string;completedAt?:string}){
    const r=await this.query(
      "UPDATE payment_intents SET status=COALESCE($2,status),provider_reference=COALESCE($3,provider_reference),completed_at=COALESCE($4::timestamptz,completed_at) WHERE id=$1 RETURNING *",
      [id,patch.status ?? null,patch.providerReference ?? null,patch.completedAt ?? null],
    );
    return r.rows[0]?this.mapPayment(r.rows[0]):undefined;
  }

  async getPaymentByProviderReference(reference:string){const r=await this.query("SELECT * FROM payment_intents WHERE provider_reference=$1",[reference]);return r.rows[0]?this.mapPayment(r.rows[0]):undefined;}
  async getPaymentIntent(id:string){const r=await this.query("SELECT * FROM payment_intents WHERE id=$1",[id]);return r.rows[0]?this.mapPayment(r.rows[0]):undefined;}
  async addPaymentEvent(intentId:string,payload:unknown){await this.query("INSERT INTO payment_events(intent_id,payload) VALUES($1,$2::jsonb)",[intentId,JSON.stringify(payload)]);}

  async settlePayment(intentId:string){
    return this.transaction(async(client)=>{
      const r=await client.query("SELECT * FROM payment_intents WHERE id=$1 FOR UPDATE",[intentId]);
      if(!r.rows[0]) return undefined;
      const intent=this.mapPayment(r.rows[0]);
      if(intent.status==="SUCCEEDED") return intent;
      await client.query("UPDATE payment_intents SET status='SUCCEEDED',completed_at=now() WHERE id=$1",[intentId]);
      if(intent.bookingId){
        const bookingRow=await client.query("SELECT * FROM bookings WHERE id=$1 FOR UPDATE",[intent.bookingId]);
        if(bookingRow.rows[0] && bookingRow.rows[0].status!=="CONFIRMED"){
          const booking=this.mapBooking(bookingRow.rows[0]);
          await client.query("UPDATE bookings SET status='CONFIRMED',updated_at=now() WHERE id=$1",[booking.id]);
          const owner=await client.query("SELECT p.owner_id,p.title FROM property_listings pl JOIN properties p ON p.id=pl.property_id WHERE pl.id=$1",[booking.listingId]);
          const ownerId=owner.rows[0]?.owner_id as string | undefined;
          const platform=Math.floor(booking.amountMinor*loadConfig().commissionBps/10000);
          const landlord=booking.amountMinor-platform;
          await this.ensureLedgerAccount(client,booking.tenantId,"CUSTOMER",booking.currency);
          await this.ensureLedgerAccount(client,ownerId ?? null,"LANDLORD",booking.currency);
          await this.ensureLedgerAccount(client,null,"PLATFORM_HOLDING",booking.currency);
          await this.ensureLedgerAccount(client,null,"PLATFORM_REVENUE",booking.currency);
          await this.ledger(client,booking.tenantId,"CUSTOMER","DEBIT",booking.amountMinor,booking.currency,booking.id);
          await this.ledger(client,null,"PLATFORM_HOLDING","CREDIT",booking.amountMinor,booking.currency,booking.id);
          if(ownerId) await this.ledger(client,ownerId,"LANDLORD","CREDIT",landlord,booking.currency,booking.id);
          await this.ledger(client,null,"PLATFORM_REVENUE","CREDIT",platform,booking.currency,booking.id);
          await client.query(
            "INSERT INTO rental_agreements(booking_id,terms) VALUES($1,$2::jsonb) ON CONFLICT(booking_id) DO NOTHING",
            [booking.id,JSON.stringify({tenantId:booking.tenantId,landlordId:ownerId,listingId:booking.listingId,rent:booking.amountMinor,deposit:booking.depositMinor,startDate:booking.startDate,endDate:booking.endDate})],
          );
          await client.query("INSERT INTO notifications(user_id,channel,event_type,title,body) VALUES($1,'in_app','BOOKING_CONFIRMED','Booking confirmed',$2)",[booking.tenantId,"Your booking is confirmed."]);
          if(ownerId) await client.query("INSERT INTO notifications(user_id,channel,event_type,title,body) VALUES($1,'in_app','PAYMENT_RECEIVED','Payment received',$2)",[ownerId,"A booking payment was received."]);
          const startDelay=Math.max(0,Math.ceil((new Date(booking.startDate).getTime()-Date.now())/1000));
          const endDelay=Math.max(startDelay+1,Math.ceil((new Date(booking.endDate).getTime()-Date.now())/1000));
          await this.enqueueJob("booking.activate",{bookingId:booking.id},startDelay);
          await this.enqueueJob("booking.complete",{bookingId:booking.id},endDelay);
        }
      }
      const fresh=await client.query("SELECT * FROM payment_intents WHERE id=$1",[intentId]);
      return this.mapPayment(fresh.rows[0]);
    });
  }

  async refundPayment(intentId:string,amountMinor:number,reason:string){
    return this.transaction(async(client)=>{
      const r=await client.query("SELECT * FROM payment_intents WHERE id=$1 FOR UPDATE",[intentId]);
      if(!r.rows[0]) return undefined;
      const current=this.mapPayment(r.rows[0]);
      if(current.status!=="SUCCEEDED" && current.status!=="PARTIALLY_REFUNDED") throw new Error("Only successful payments can be refunded");
      const already=await client.query("SELECT COALESCE(SUM(amount_minor),0)::bigint total FROM payment_refunds WHERE intent_id=$1 AND status IN ('PENDING','COMPLETED')",[intentId]);
      const refunded=Number(already.rows[0].total);
      if(refunded+amountMinor>current.amountMinor) throw new Error("Refund exceeds remaining captured amount");
      await client.query("INSERT INTO payment_refunds(intent_id,amount_minor,reason,status) VALUES($1,$2,$3,'PENDING')",[intentId,amountMinor,reason]);
      const nextStatus=refunded+amountMinor>=current.amountMinor ? "REFUNDED" : "PARTIALLY_REFUNDED";
      await client.query("UPDATE payment_intents SET status=$2 WHERE id=$1",[intentId,nextStatus]);
      const fresh=await client.query("SELECT * FROM payment_intents WHERE id=$1",[intentId]);
      return this.mapPayment(fresh.rows[0]);
    });
  }

  async enqueueJob(name:string,payload:Record<string,unknown>,delaySeconds=0){
    const r=await this.query(
      "INSERT INTO background_jobs(name,payload,run_at) VALUES($1,$2::jsonb,now()+($3 || ' seconds')::interval) RETURNING id,name,status,run_at",
      [name,JSON.stringify(payload),delaySeconds],
    );
    return r.rows[0];
  }

  async addMedia(propertyId:string,kind:string,key:string){
    const id=randomUUID();
    const order=await this.query("SELECT COALESCE(MAX(sort_order),-1)+1 next FROM property_media WHERE property_id=$1",[propertyId]);
    const r=await this.query("INSERT INTO property_media(id,property_id,kind,storage_key,sort_order) VALUES($1,$2,$3,$4,$5) RETURNING *",[id,propertyId,kind,key,Number(order.rows[0].next)]);
    return r.rows[0];
  }

  async count(table:string,where="AND TRUE",values:readonly unknown[]=[]){
    if(!/^[a-z_]+$/.test(table)) throw new Error("Invalid table");
    const r=await this.query("SELECT COUNT(*)::int count FROM "+table+" WHERE "+where.replace(/^AND /,""),values);
    return Number(r.rows[0].count);
  }

  private async ensureLedgerAccount(client:PoolClient,userId:string|null,kind:string,currency:string){
    await client.query(
      "INSERT INTO ledger_accounts(owner_user_id,kind,currency) VALUES($1,$2,$3) ON CONFLICT(owner_user_id,kind,currency) DO NOTHING",
      [userId,kind,currency],
    );
    const r=await client.query("SELECT id FROM ledger_accounts WHERE owner_user_id IS NOT DISTINCT FROM $1 AND kind=$2 AND currency=$3",[userId,kind,currency]);
    return r.rows[0].id as string;
  }

  private async ledger(client:PoolClient,userId:string|null,kind:string,direction:string,amount:number,currency:string,reference:string){
    const account=await this.ensureLedgerAccount(client,userId,kind,currency);
    await client.query("INSERT INTO ledger_entries(account_id,direction,amount_minor,currency,reference) VALUES($1,$2,$3,$4,$5)",[account,direction,amount,currency,reference]);
  }

  async findMatchingSavedSearches(propertyId:string) {
    const property=await this.hydrateProperty(propertyId);
    if(!property || property.status!=="PUBLISHED") return [];
    const searches=await this.query("SELECT * FROM saved_searches WHERE notify=TRUE ORDER BY created_at DESC");
    return searches.rows.filter((row:any)=>{
      const criteria=(row.criteria ?? {}) as Record<string,unknown>;
      return property.listings.some((listing:any)=>
        listing.status==="ACTIVE" && matchesSavedSearch(criteria as any,{
          listingType:String(listing.listingType),
          propertyType:String(property.propertyType),
          district:property.district,
          bedrooms:property.bedrooms,
          priceMinor:Number(listing.priceMinor),
          amenities:property.amenities,
          furnished:property.amenities.some((a:string)=>a.toLowerCase()==="furnished"),
        })
      );
    });
  }


  async getMfaSecret(userId:string){
    const r=await this.query("SELECT mfa_secret,mfa_enabled FROM users WHERE id=$1",[userId]);
    return r.rows[0] ? {secret:r.rows[0].mfa_secret ?? undefined,enabled:Boolean(r.rows[0].mfa_enabled)} : undefined;
  }

  async setMfaSecret(userId:string,secret:string){
    await this.query("UPDATE users SET mfa_secret=$2,updated_at=now() WHERE id=$1",[userId,secret]);
  }

  async setMfaEnabled(userId:string,enabled:boolean){
    await this.query("UPDATE users SET mfa_enabled=$2,updated_at=now() WHERE id=$1",[userId,enabled]);
  }

  async createReauthToken(userId:string,action:string,tokenHash:string,expiresAt:Date){
    await this.query("DELETE FROM reauth_tokens WHERE user_id=$1 AND action=$2 AND (consumed_at IS NOT NULL OR expires_at<=now())",[userId,action]);
    await this.query("INSERT INTO reauth_tokens(user_id,action,token_hash,expires_at) VALUES($1,$2,$3,$4)",[userId,action,tokenHash,expiresAt]);
  }

  async consumeReauthToken(userId:string,action:string,tokenHash:string){
    const r=await this.query(
      "UPDATE reauth_tokens SET consumed_at=now() WHERE user_id=$1 AND action=$2 AND token_hash=$3 AND consumed_at IS NULL AND expires_at>now() RETURNING id",
      [userId,action,tokenHash],
    );
    return Boolean(r.rows[0]);
  }

  async listSessions(userId:string){
    return this.query(
      "SELECT id,user_agent,ip,expires_at,revoked_at,created_at FROM sessions WHERE user_id=$1 ORDER BY created_at DESC",
      [userId],
    ).then(r=>r.rows);
  }

  async revokeSession(userId:string,sessionId:string){
    const r=await this.query(
      "UPDATE sessions SET revoked_at=now() WHERE id=$1 AND user_id=$2 AND revoked_at IS NULL RETURNING id",
      [sessionId,userId],
    );
    return Boolean(r.rows[0]);
  }

  async registerPushToken(userId:string,token:string,platform:string){
    const r=await this.query(
      "INSERT INTO device_push_tokens(user_id,token,platform) VALUES($1,$2,$3) ON CONFLICT(token) DO UPDATE SET user_id=EXCLUDED.user_id,platform=EXCLUDED.platform,updated_at=now() RETURNING *",
      [userId,token,platform],
    );
    return r.rows[0];
  }

  async removePushToken(userId:string,token:string){
    await this.query("DELETE FROM device_push_tokens WHERE user_id=$1 AND token=$2",[userId,token]);
    return {ok:true};
  }

  async getPushTokens(userId:string){
    return this.query("SELECT token,platform FROM device_push_tokens WHERE user_id=$1 ORDER BY updated_at DESC",[userId]).then(r=>r.rows);
  }

  async getNotification(id:string){
    const r=await this.query("SELECT * FROM notifications WHERE id=$1",[id]);
    return r.rows[0];
  }

  async getNotificationPreferences(userId:string){
    const r=await this.query("SELECT * FROM notification_preferences WHERE user_id=$1",[userId]);
    return r.rows[0] ?? {push_enabled:true,sms_enabled:true,email_enabled:true,in_app_enabled:true};
  }

  async updateNotificationPreferences(userId:string,input:{pushEnabled?:boolean;smsEnabled?:boolean;emailEnabled?:boolean;inAppEnabled?:boolean}){
    const prefs=await this.getNotificationPreferences(userId);
    const next={
      push:prefs.push_enabled,
      sms:prefs.sms_enabled,
      email:prefs.email_enabled,
      inApp:prefs.in_app_enabled,
      ...(input.pushEnabled!==undefined?{push:input.pushEnabled}:{}),
      ...(input.smsEnabled!==undefined?{sms:input.smsEnabled}:{}),
      ...(input.emailEnabled!==undefined?{email:input.emailEnabled}:{}),
      ...(input.inAppEnabled!==undefined?{inApp:input.inAppEnabled}:{}),
    };
    const r=await this.query(
      "INSERT INTO notification_preferences(user_id,push_enabled,sms_enabled,email_enabled,in_app_enabled) VALUES($1,$2,$3,$4,$5) "+
      "ON CONFLICT(user_id) DO UPDATE SET push_enabled=EXCLUDED.push_enabled,sms_enabled=EXCLUDED.sms_enabled,email_enabled=EXCLUDED.email_enabled,in_app_enabled=EXCLUDED.in_app_enabled "+
      "RETURNING *",
      [userId,next.push,next.sms,next.email,next.inApp],
    );
    return r.rows[0];
  }

  async updatePaymentRefundProviderReference(refundId:string,providerReference:string,status="PENDING"){
    const r=await this.query("UPDATE payment_refunds SET provider_reference=$2,status=$3 WHERE id=$1 RETURNING *",[refundId,providerReference,status]);
    return r.rows[0];
  }

  private mapUser(row:any):UserRecord{
    return {
      id:String(row.id),email:String(row.email),phone:String(row.phone),passwordHash:String(row.password_hash),
      fullName:String(row.full_name),locale:String(row.locale),roles:(row.roles ?? []) as Role[],status:String(row.status),
      mfaEnabled:Boolean(row.mfa_enabled),organizationId:row.organization_id ?? undefined,createdAt:new Date(row.created_at).toISOString(),
    };
  }

  private mapListing(row:any):ListingRecord{
    return {
      id:String(row.id),propertyId:String(row.property_id),unitId:row.unit_id ?? undefined,listingType:row.listing_type,
      status:String(row.status),priceMinor:Number(row.price_minor ?? 0),currency:String(row.currency),
      availableFrom:new Date(row.available_from).toISOString(),createdAt:new Date(row.created_at).toISOString(),updatedAt:new Date(row.updated_at).toISOString(),
    };
  }

  private mapBooking(row:any):BookingRecord{
    return {
      id:String(row.id),listingId:String(row.listing_id),unitId:row.unit_id ?? undefined,tenantId:String(row.tenant_id),
      status:String(row.status),startDate:String(row.start_date),endDate:String(row.end_date),amountMinor:Number(row.amount_minor),
      depositMinor:Number(row.deposit_minor),currency:String(row.currency),idempotencyKey:String(row.idempotency_key),createdAt:new Date(row.created_at).toISOString(),
    };
  }

  private mapPayment(row:any):PaymentIntentRecord{
    return {
      id:String(row.id),bookingId:row.booking_id ?? undefined,payerId:String(row.payer_id),provider:String(row.provider),
      amountMinor:Number(row.amount_minor),currency:String(row.currency),status:String(row.status),internalReference:String(row.internal_reference),
      providerReference:row.provider_reference ?? undefined,checkoutUrl:row.checkout_url ?? undefined,idempotencyKey:String(row.idempotency_key),
      createdAt:new Date(row.created_at).toISOString(),completedAt:row.completed_at ? new Date(row.completed_at).toISOString() : undefined,
    };
  }

  private mapPropertyFromSearchRow(row:any):PropertyRecord{
    return {
      id:String(row.property_id),ownerId:String(row.owner_id),organizationId:row.organization_id ?? undefined,title:String(row.title),
      description:String(row.description),propertyType:String(row.property_type),status:row.property_status as PropertyRecord["status"],
      countryCode:String(row.country_code),verificationStatus:String(row.verification_status),riskLevel:row.risk_level,
      riskScore:Number(row.risk_score),province:String(row.province),district:String(row.district),sector:row.sector ?? undefined,
      cell:row.cell ?? undefined,village:row.village ?? undefined,latitude:Number(row.latitude),longitude:Number(row.longitude),
      bedrooms:row.bedrooms == null ? undefined:Number(row.bedrooms),bathrooms:row.bathrooms == null ? undefined:Number(row.bathrooms),
      parking:row.parking == null ? undefined:Number(row.parking),areaValue:row.area_value == null ? undefined:Number(row.area_value),
      areaUnit:String(row.area_unit),amenities:[],media:[],createdAt:new Date(row.property_created_at).toISOString(),updatedAt:new Date(row.property_updated_at).toISOString(),
    };
  }
}
