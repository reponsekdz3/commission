import { Body, Controller, Get, Post, Query, BadRequestException } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { Throttle } from "@nestjs/throttler";
import { createMapProvider } from "@imizi/maps";
import { Public } from "../../common/public.decorator";
import { z } from "zod";

const maps = createMapProvider(process.env.MAPS_PROVIDER ?? "catalog");
const coordinateSchema=z.object({latitude:z.coerce.number().gte(-90).lte(90),longitude:z.coerce.number().gte(-180).lte(180)});

@ApiTags("maps")
@Controller("maps")
export class MapsController {
  @Public() @Throttle({default:{limit:30,ttl:60000}}) @Get("geocode")
  geocode(@Query("q") q: string) { return maps.geocode(z.string().trim().min(2).max(200).parse(q ?? ""), "RW"); }
  @Public() @Throttle({default:{limit:60,ttl:60000}}) @Get("reverse")
  reverse(@Query("lat") lat: string, @Query("lng") lng: string) { return maps.reverseGeocode(coordinateSchema.parse({latitude:lat,longitude:lng})); }
  @Public() @Throttle({default:{limit:60,ttl:60000}}) @Get("nearby")
  nearby(@Query("lat") lat: string, @Query("lng") lng: string) { return maps.getNearbyPlaces(coordinateSchema.parse({latitude:lat,longitude:lng}), ["all"]); }
  @Public() @Throttle({default:{limit:30,ttl:60000}}) @Post("route")
  route(@Body() body: unknown) {
    const parsed=z.object({from:coordinateSchema,to:coordinateSchema}).safeParse(body);
    if(!parsed.success)throw new BadRequestException("Invalid route coordinates");
    return maps.calculateRoute(parsed.data.from,parsed.data.to);
  }
}
