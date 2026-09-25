import type { ParsedSearchQuery, PropertyType, ListingType } from "@imizi/types";

const TYPE_ALIASES: Record<string, PropertyType> = {
  house: "HOUSE",
  inzu: "HOUSE",
  apartment: "APARTMENT",
  studio: "STUDIO",
  villa: "VILLA",
  office: "OFFICE",
  shop: "SHOP",
  warehouse: "WAREHOUSE",
  land: "LAND",
  ubutaka: "LAND",
};

const LISTING_ALIASES: Record<string, ListingType> = {
  rent: "RENT",
  rental: "RENT",
  gukodesha: "RENT",
  buy: "SALE",
  sale: "SALE",
  kugura: "SALE",
  "short stay": "SHORT_STAY",
};

const AMENITY_ALIASES: Record<string, string> = {
  furnished: "furnished",
  parking: "parking",
  water: "water",
  electricity: "electricity",
  internet: "internet",
  security: "security",
};

function parseNumberAfter(text: string, pattern: RegExp): number | undefined {
  const match = text.match(pattern);
  if (!match) return undefined;
  const value = Number(match[1].replace(/,/g, ""));
  return Number.isFinite(value) ? value : undefined;
}

export function parseNaturalSearch(raw: string): ParsedSearchQuery {
  const text = raw.trim().toLowerCase();
  const result: ParsedSearchQuery = { raw: raw.trim(), amenities: [] };

  for (const [alias, type] of Object.entries(TYPE_ALIASES)) {
    if (new RegExp(`\\b${alias}\\b`, "i").test(text)) {
      result.type = type;
      break;
    }
  }
  for (const [alias, listing] of Object.entries(LISTING_ALIASES)) {
    if (text.includes(alias)) {
      result.listingType = listing;
      break;
    }
  }

  result.bedrooms = parseNumberAfter(text, /(\d+)\s*(?:bed|bedroom|chambre|chambres)/i);
  result.bathrooms = parseNumberAfter(text, /(\d+)\s*(?:bath|bathroom)/i);
  result.maxPrice = parseNumberAfter(
    text,
    /(?:under|below|less than|<|max)\s*([\d,]+)\s*(?:rwf|frw|m)?/i,
  );
  const million = text.match(/under\s*([\d.]+)\s*million/i);
  if (million) {
    result.maxPrice = Math.round(Number(million[1]) * 1_000_000);
  }

  const near = text.match(/near\s+([a-zA-Z\s]+?)(?:\s+with|\s+under|\s+in|$)/i);
  const inLoc = text.match(/\bin\s+([a-zA-Z\s]+?)(?:\s+with|\s+under|$)/i);
  result.locationText = (near?.[1] ?? inLoc?.[1])?.trim();

  if (text.includes("verified")) result.verifiedOnly = true;
  for (const [alias, amenity] of Object.entries(AMENITY_ALIASES)) {
    if (text.includes(alias)) result.amenities.push(amenity);
  }

  return result;
}
