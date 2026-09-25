import { Controller, Get, Query } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { Throttle } from "@nestjs/throttler";
import { searchSchema } from "@imizi/validation";
import { Public } from "../../common/public.decorator";
import { SearchService } from "./search.service";

@ApiTags("search")
@Controller("search")
export class SearchController {
  constructor(private readonly search: SearchService) {}

  @Public()
  @Throttle({ search: { limit: 60, ttl: 60_000 } })
  @Get()
  run(@Query() query: Record<string, string>) {
    return this.search.search(searchSchema.parse(query));
  }

  @Public()
  @Get("suggest")
  suggest(@Query("q") q: string) {
    return this.search.suggest(q ?? "");
  }
}
