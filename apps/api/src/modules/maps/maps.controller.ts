import { Body, Controller, Get, Post, Query } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { createMapProvider } from "@imizi/maps";
import { Public } from "../../common/public.decorator";

const maps = createMapProvider(process.env.MAPS_PROVIDER ?? "catalog");

@ApiTags("maps")
@Controller("maps")
export class MapsController {
  @Public()
  @Get("geocode")
  geocode(@Query("q") q: string) {
    return maps.geocode(q ?? "Kigali", "RW");
  }

  @Public()
  @Get("reverse")
  reverse(@Query("lat") lat: string, @Query("lng") lng: string) {
    return maps.reverseGeocode({ latitude: Number(lat), longitude: Number(lng) });
  }

  @Public()
  @Get("nearby")
  nearby(@Query("lat") lat: string, @Query("lng") lng: string) {
    return maps.getNearbyPlaces({ latitude: Number(lat), longitude: Number(lng) }, ["all"]);
  }

  @Public()
  @Post("route")
  route(@Body() body: { from: { latitude: number; longitude: number }; to: { latitude: number; longitude: number } }) {
    return maps.calculateRoute(body.from, body.to);
  }
}
