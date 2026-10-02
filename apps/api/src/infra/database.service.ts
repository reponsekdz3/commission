    const r=await this.query(
      "INSERT INTO property_units(id,property_id,label,bedrooms,bathrooms,parking,status) VALUES($1,$2,$3,$4,$5,$6,'AVAILABLE') RETURNING *",
      [id,propertyId,input.label,input.bedrooms ?? null,input.bathrooms ?? null,input.parking ?? 0],
    );
    return {id:r.rows[0].id,propertyId:r.rows[0].property_id,label:r.rows[0].label,bedrooms:r.rows[0].bedrooms,bathrooms:r.rows[0].bathrooms,parking:r.rows[0].parking,status:r.rows[0].status};
  }

  async createListing(input:{propertyId:string;unitId?:string;listingType:string;priceMinor:number;currency:string;availableFrom:string}) {
    const id=randomUUID();
    await this.transaction(async(client)=>{
      if(input.unitId){
        const unit=await client.query("SELECT id,property_id,status FROM property_units WHERE id=$1 FOR SHARE",[input.unitId]);
        if(!unit.rows[0] || String(unit.rows[0].property_id)!==input.propertyId) throw new Error("listing_unit_property_mismatch");
        if(["MAINTENANCE","OCCUPIED"].includes(String(unit.rows[0].status))) throw new Error("listing_unit_unavailable");
      }
      const property=await client.query("SELECT status FROM properties WHERE id=$1 FOR SHARE",[input.propertyId]);
      if(!property.rows[0]) throw new Error("property_not_found");
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