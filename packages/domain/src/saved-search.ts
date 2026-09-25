export interface SavedSearchCriteria {
  listingType?: string;
  propertyType?: string;
  district?: string;
  bedroomsMin?: number;
  bedroomsMax?: number;
  maxPriceMinor?: number;
  amenities?: string[];
  furnished?: boolean;
}

export interface PropertySnapshot {
  listingType: string;
  propertyType: string;
  district?: string;
  bedrooms?: number;
  priceMinor: number;
  amenities: string[];
  furnished?: boolean;
}

export function matchesSavedSearch(
  search: SavedSearchCriteria,
  property: PropertySnapshot,
): boolean {
  if (search.listingType && search.listingType !== property.listingType) return false;
  if (search.propertyType && search.propertyType !== property.propertyType) return false;
  if (search.district && search.district.toLowerCase() !== property.district?.toLowerCase()) {
    return false;
  }
  if (search.bedroomsMin != null && (property.bedrooms ?? 0) < search.bedroomsMin) return false;
  if (search.bedroomsMax != null && (property.bedrooms ?? 0) > search.bedroomsMax) return false;
  if (search.maxPriceMinor != null && property.priceMinor > search.maxPriceMinor) return false;
  if (search.furnished != null && property.furnished !== search.furnished) return false;
  if (search.amenities?.length) {
    const set = new Set(property.amenities.map((a) => a.toLowerCase()));
    if (!search.amenities.every((a) => set.has(a.toLowerCase()))) return false;
  }
  return true;
}
