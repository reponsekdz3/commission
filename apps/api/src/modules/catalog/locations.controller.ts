import { BadRequestException, Controller, Get, Query } from "@nestjs/common";
import { Public } from "../../common/public.decorator";
import { LocationsService } from "./locations.service";

const levels = new Set(["PROVINCE","DISTRICT","SECTOR","CELL","VILLAGE"]);

@Controller("locations/rwanda")
export class LocationsController {
  constructor(private readonly locations: LocationsService) {}

  @Public()
  @Get()
  list(@Query("level") level = "PROVINCE", @Query("parentId") parentId?: string) {
    const normalized = level.toUpperCase();
    if (!levels.has(normalized)) throw new BadRequestException("Unsupported location level");
    return this.locations.list(normalized as any, parentId);
  }

  @Public()
  @Get("all")
  all() {
    return this.locations.hierarchy();
  }
}
