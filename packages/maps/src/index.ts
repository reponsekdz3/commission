import type { GeoPoint } from "@imizi/types";

export interface GeocodeResult {
  label: string;
  point: GeoPoint;
  countryCode?: string;
  province?: string;
  district?: string;
  sector?: string;
}

export interface PlaceResult {
  id: string;
  name: string;
  category: string;
  point: GeoPoint;
  distanceMeters?: number;
}

export interface RouteResult {
  distanceMeters: number;
  durationSeconds: number;
  polyline: string;
}

export interface MapProvider {
  geocode(query: string, countryBias?: string): Promise<GeocodeResult[]>;
  reverseGeocode(point: GeoPoint): Promise<GeocodeResult | null>;
  searchPlaces(query: string, near: GeoPoint): Promise<PlaceResult[]>;
  calculateRoute(from: GeoPoint, to: GeoPoint): Promise<RouteResult>;
  getNearbyPlaces(point: GeoPoint, categories: string[]): Promise<PlaceResult[]>;
}

export class MapProviderRouter implements MapProvider {
  constructor(private readonly provider: MapProvider) {}
  geocode(query: string, countryBias?: string) {
    return this.provider.geocode(query, countryBias);
  }
  reverseGeocode(point: GeoPoint) {
    return this.provider.reverseGeocode(point);
  }
  searchPlaces(query: string, near: GeoPoint) {
    return this.provider.searchPlaces(query, near);
  }
  calculateRoute(from: GeoPoint, to: GeoPoint) {
    return this.provider.calculateRoute(from, to);
  }
  getNearbyPlaces(point: GeoPoint, categories: string[]) {
    return this.provider.getNearbyPlaces(point, categories);
  }
}

function haversineMeters(a: GeoPoint, b: GeoPoint): number {
  const R = 6371000;
  const dLat = ((b.latitude - a.latitude) * Math.PI) / 180;
  const dLon = ((b.longitude - a.longitude) * Math.PI) / 180;
  const lat1 = (a.latitude * Math.PI) / 180;
  const lat2 = (b.latitude * Math.PI) / 180;
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

/** Offline-capable Rwanda catalog used when live map keys are absent. */
export class RwandaCatalogMapProvider implements MapProvider {
  private readonly catalog: GeocodeResult[] = [
    { label: "Kigali", point: { latitude: -1.9441, longitude: 30.0619 }, countryCode: "RW", province: "Kigali", district: "Nyarugenge" },
    { label: "Kicukiro, Kigali", point: { latitude: -1.978, longitude: 30.112 }, countryCode: "RW", province: "Kigali", district: "Kicukiro" },
    { label: "Gasabo, Kigali", point: { latitude: -1.92, longitude: 30.12 }, countryCode: "RW", province: "Kigali", district: "Gasabo" },
    { label: "Nyarugenge, Kigali", point: { latitude: -1.943, longitude: 30.059 }, countryCode: "RW", province: "Kigali", district: "Nyarugenge" },
    { label: "Musanze", point: { latitude: -1.4998, longitude: 29.635 }, countryCode: "RW", province: "Northern", district: "Musanze" },
    { label: "Huye", point: { latitude: -2.5967, longitude: 29.739 }, countryCode: "RW", province: "Southern", district: "Huye" },
    { label: "Rubavu", point: { latitude: -1.702, longitude: 29.256 }, countryCode: "RW", province: "Western", district: "Rubavu" },
  ];

  async geocode(query: string): Promise<GeocodeResult[]> {
    const q = query.toLowerCase();
    return this.catalog.filter((c) => c.label.toLowerCase().includes(q));
  }

  async reverseGeocode(point: GeoPoint): Promise<GeocodeResult | null> {
    return this.catalog
      .map((c) => ({ c, d: haversineMeters(point, c.point) }))
      .sort((a, b) => a.d - b.d)[0]?.c ?? null;
  }

  async searchPlaces(query: string, near: GeoPoint): Promise<PlaceResult[]> {
    return this.getNearbyPlaces(near, [query]);
  }

  async calculateRoute(from: GeoPoint, to: GeoPoint): Promise<RouteResult> {
    const distanceMeters = Math.round(haversineMeters(from, to));
    return {
      distanceMeters,
      durationSeconds: Math.round(distanceMeters / 8.3),
      polyline: `${from.latitude},${from.longitude};${to.latitude},${to.longitude}`,
    };
  }

  async getNearbyPlaces(point: GeoPoint, categories: string[]): Promise<PlaceResult[]> {
    const seeds: PlaceResult[] = [
      { id: "sch-1", name: "GS Kicukiro", category: "school", point: { latitude: point.latitude + 0.004, longitude: point.longitude + 0.002 } },
      { id: "mkt-1", name: "Kicukiro Market", category: "market", point: { latitude: point.latitude - 0.003, longitude: point.longitude + 0.001 } },
      { id: "hosp-1", name: "Kigali Hospital", category: "hospital", point: { latitude: point.latitude + 0.01, longitude: point.longitude - 0.004 } },
      { id: "bank-1", name: "BK Branch", category: "bank", point: { latitude: point.latitude + 0.002, longitude: point.longitude - 0.001 } },
      { id: "bus-1", name: "Bus stop", category: "transit", point: { latitude: point.latitude - 0.001, longitude: point.longitude + 0.003 } },
    ];
    return seeds
      .filter((p) => categories.length === 0 || categories.some((c) => p.category.includes(c.toLowerCase()) || c === "all"))
      .map((p) => ({ ...p, distanceMeters: Math.round(haversineMeters(point, p.point)) }));
  }
}

export function createMapProvider(kind: string): MapProvider {
  void kind;
  return new MapProviderRouter(new RwandaCatalogMapProvider());
}

export { haversineMeters };
