import { Controller, Delete, Get, Param, Post } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { CurrentUser } from "../../common/current-user.decorator";
import { UserRecord } from "../../store/platform.store";
import { FeatureService } from "../../infra/feature.service";

@ApiTags("favorites")
@ApiBearerAuth()
@Controller("favorites")
export class FavoritesController {
  constructor(private readonly features:FeatureService) {}
  @Get() list(@CurrentUser() user:UserRecord){return this.features.favorites(user.id);}
  @Post(":propertyId") add(@CurrentUser() user:UserRecord,@Param("propertyId") propertyId:string){return this.features.favoriteAdd(user.id,propertyId);}
  @Delete(":propertyId") remove(@CurrentUser() user:UserRecord,@Param("propertyId") propertyId:string){return this.features.favoriteRemove(user.id,propertyId);}
}
