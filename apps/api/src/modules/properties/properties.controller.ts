import { Body, Controller, Get, Param, Patch, Post } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { createPropertySchema, updatePropertySchema } from "@imizi/validation";
import { Public } from "../../common/public.decorator";
import { CurrentUser } from "../../common/current-user.decorator";
import { PropertiesService } from "./properties.service";
import { UserRecord } from "../../store/platform.store";

@ApiTags("properties")
@Controller("properties")
export class PropertiesController {
  constructor(private readonly properties: PropertiesService) {}

  @ApiBearerAuth()
  @Get("owned")
  owned(@CurrentUser() user: UserRecord) { return this.properties.owned(user); }

  @ApiBearerAuth()
  @Post()
  create(@CurrentUser() user: UserRecord,@Body() body:unknown){ return this.properties.create(user,createPropertySchema.parse(body)); }

  @Public()
  @Get(":id")
  get(@Param("id") id:string,@CurrentUser() user?:UserRecord){ return this.properties.get(id,user); }

  @ApiBearerAuth()
  @Patch(":id")
  update(@Param("id") id:string,@CurrentUser() user:UserRecord,@Body() body:Record<string,unknown>){ return this.properties.update(id,user,updatePropertySchema.parse(body)); }

  @ApiBearerAuth()
  @Post(":id/publish")
  publish(@Param("id") id:string,@CurrentUser() user:UserRecord){ return this.properties.publish(id,user); }

  @ApiBearerAuth()
  @Post(":id/units")
  addUnit(@Param("id") id:string,@CurrentUser() user:UserRecord,@Body() body:{label:string;bedrooms?:number}){ return this.properties.addUnit(id,user,body); }
}
