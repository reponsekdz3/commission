import { Controller, Get, Header, Headers, HttpStatus, Res } from "@nestjs/common";
import type { Response } from "express";
import { Public } from "../../common/public.decorator";
import { DatabaseService } from "../../infra/database.service";
import { Dependencies } from "../../infra/dependencies";

@Controller()
export class HealthController {
  constructor(private readonly db:DatabaseService,private readonly deps:Dependencies){}
  @Public() @Get("/health") health(){return this.snapshot();}
  @Public() @Get("/ready") async ready(@Res({passthrough:true}) res:Response){const snap=await this.snapshot();const ok=Boolean(snap.api&&snap.database&&snap.redis);if(!ok)res.status(HttpStatus.SERVICE_UNAVAILABLE);return {...snap,ready:ok};}
  @Public() @Get("/live") live(){return{status:"ok"};}
  @Public() @Header("content-type","text/plain") @Get("/metrics") async metrics(@Headers("x-metrics-token") token?:string){if(process.env.NODE_ENV==="production"){const expected=process.env.METRICS_TOKEN;if(!expected||token!==expected)return "# HELP imizi_metrics_access_denied Metrics endpoint authentication failure\n# TYPE imizi_metrics_access_denied counter\nimizi_metrics_access_denied 1";}
    const snap=await this.snapshot();
    return [
      "# HELP imizi_database_up PostgreSQL connectivity","# TYPE imizi_database_up gauge","imizi_database_up "+(snap.database?1:0),
      "# HELP imizi_redis_up Redis connectivity","# TYPE imizi_redis_up gauge","imizi_redis_up "+(snap.redis?1:0),
      "# HELP imizi_search_up OpenSearch connectivity","# TYPE imizi_search_up gauge","imizi_search_up "+(snap.search?1:0),
      "# HELP imizi_properties Published property count","# TYPE imizi_properties gauge","imizi_properties "+snap.properties,
      "# HELP imizi_listings Active listing count","# TYPE imizi_listings gauge","imizi_listings "+snap.listings,
    ].join("\n");
  }
  private async readiness(){const snap=await this.snapshot();return{...snap,ready:snap.api&&snap.database&&snap.redis};}
  private async snapshot(){
    let properties=0,listings=0;
    if(this.deps.databaseOk){properties=await this.db.count("properties","status='PUBLISHED'");listings=await this.db.count("property_listings","status='ACTIVE'");}
    return{status:"ok",api:true,database:this.deps.databaseOk,redis:this.deps.redisOk,search:this.deps.searchOk,storage:this.deps.storageOk,payment:this.deps.paymentOk,properties,listings};
  }
}
