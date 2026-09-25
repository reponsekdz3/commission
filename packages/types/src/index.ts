export type CurrencyCode = "RWF" | "USD" | "KES" | "UGX" | "TZS";
export type LocaleCode = "rw" | "en" | "fr";
export type CountryCode = "RW" | "UG" | "KE" | "TZ";

export const ROLES = [
  "SUPER_ADMIN",
  "ADMIN",
  "MODERATOR",
  "VERIFICATION_AGENT",
  "FINANCE_ADMIN",
  "USER",
  "TENANT",
  "BUYER",
  "LANDLORD",
  "SELLER",
  "AGENT",
  "AGENCY_ADMIN",
  "PROPERTY_MANAGER",
] as const;
export type Role = (typeof ROLES)[number];

export const PROPERTY_TYPES = [
  "HOUSE",
  "APARTMENT",
  "APARTMENT_BUILDING",
  "VILLA",
  "STUDIO",
  "OFFICE",
  "SHOP",
  "WAREHOUSE",
  "LAND",
  "MIXED_USE",
] as const;
export type PropertyType = (typeof PROPERTY_TYPES)[number];

export const LISTING_TYPES = ["RENT", "SALE", "SHORT_STAY"] as const;
export type ListingType = (typeof LISTING_TYPES)[number];

export const BOOKING_STATUSES = [
  "PENDING",
  "PAYMENT_PENDING",
  "CONFIRMED",
  "ACTIVE",
  "COMPLETED",
  "CANCELLED",
  "EXPIRED",
] as const;
export type BookingStatus = (typeof BOOKING_STATUSES)[number];

export const PAYMENT_STATUSES = [
  "CREATED",
  "INITIATED",
  "PENDING_PROVIDER",
  "SUCCEEDED",
  "FAILED",
  "EXPIRED",
  "REFUNDED",
  "PARTIALLY_REFUNDED",
] as const;
export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];

export const OFFER_STATUSES = [
  "OFFER_PENDING",
  "SELLER_REVIEWING",
  "COUNTERED",
  "ACCEPTED",
  "REJECTED",
  "WITHDRAWN",
  "EXPIRED",
] as const;
export type OfferStatus = (typeof OFFER_STATUSES)[number];

export const VERIFICATION_STATUSES = [
  "UNVERIFIED",
  "SUBMITTED",
  "UNDER_REVIEW",
  "VERIFIED",
  "REJECTED",
] as const;
export type VerificationStatus = (typeof VERIFICATION_STATUSES)[number];

export const VERIFICATION_TYPES = [
  "PHONE",
  "IDENTITY",
  "OWNER",
  "AGENCY",
  "PROPERTY",
  "DOCUMENTS",
  "BUSINESS",
] as const;
export type VerificationType = (typeof VERIFICATION_TYPES)[number];

export const RISK_LEVELS = ["LOW", "MEDIUM", "HIGH", "BLOCKED"] as const;
export type RiskLevel = (typeof RISK_LEVELS)[number];

export const MESSAGE_STATUSES = ["SENT", "DELIVERED", "READ"] as const;
export type MessageStatus = (typeof MESSAGE_STATUSES)[number];

export const MAINTENANCE_STATUSES = [
  "OPEN",
  "ASSIGNED",
  "IN_PROGRESS",
  "RESOLVED",
  "CLOSED",
] as const;
export type MaintenanceStatus = (typeof MAINTENANCE_STATUSES)[number];

export interface Money {
  amountMinor: number;
  currency: CurrencyCode;
}

export interface GeoPoint {
  latitude: number;
  longitude: number;
}

export interface GeoBounds {
  north: number;
  south: number;
  east: number;
  west: number;
}

export interface ParsedSearchQuery {
  raw: string;
  type?: PropertyType;
  listingType?: ListingType;
  bedrooms?: number;
  bathrooms?: number;
  minPrice?: number;
  maxPrice?: number;
  locationText?: string;
  furnished?: boolean;
  verifiedOnly?: boolean;
  amenities: string[];
}

export interface RankingWeights {
  textRelevance: number;
  location: number;
  filterMatch: number;
  availability: number;
  verified: number;
  listingQuality: number;
  freshness: number;
}

export const DEFAULT_RANKING_WEIGHTS: RankingWeights = {
  textRelevance: 0.3,
  location: 0.25,
  filterMatch: 0.2,
  availability: 0.1,
  verified: 0.05,
  listingQuality: 0.05,
  freshness: 0.05,
};

export interface SearchFilters {
  listingType?: ListingType;
  propertyType?: PropertyType;
  countryCode?: CountryCode;
  province?: string;
  district?: string;
  sector?: string;
  cell?: string;
  village?: string;
  bedroomsMin?: number;
  bedroomsMax?: number;
  bathroomsMin?: number;
  maxPriceMinor?: number;
  minPriceMinor?: number;
  currency?: CurrencyCode;
  amenities?: string[];
  verifiedOnly?: boolean;
  availableFrom?: string;
  radiusKm?: number;
  near?: GeoPoint;
  bounds?: GeoBounds;
  cursor?: string;
  limit?: number;
}

export interface ApiErrorBody {
  code: string;
  message: string;
  requestId: string;
  details?: Record<string, unknown>;
}
