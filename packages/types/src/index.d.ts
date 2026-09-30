export type CurrencyCode = "RWF" | "USD" | "KES" | "UGX" | "TZS";
export type LocaleCode = "rw" | "en" | "fr";
export type CountryCode = "RW" | "UG" | "KE" | "TZ";
export declare const ROLES: readonly ["SUPER_ADMIN", "ADMIN", "MODERATOR", "VERIFICATION_AGENT", "FINANCE_ADMIN", "USER", "TENANT", "BUYER", "LANDLORD", "SELLER", "AGENT", "AGENCY_ADMIN", "PROPERTY_MANAGER"];
export type Role = (typeof ROLES)[number];
export declare const PROPERTY_TYPES: readonly ["HOUSE", "APARTMENT", "APARTMENT_BUILDING", "VILLA", "STUDIO", "OFFICE", "SHOP", "WAREHOUSE", "LAND", "MIXED_USE"];
export type PropertyType = (typeof PROPERTY_TYPES)[number];
export declare const LISTING_TYPES: readonly ["RENT", "SALE", "SHORT_STAY"];
export type ListingType = (typeof LISTING_TYPES)[number];
export declare const BOOKING_STATUSES: readonly ["PENDING", "PAYMENT_PENDING", "CONFIRMED", "ACTIVE", "COMPLETED", "CANCELLED", "EXPIRED"];
export type BookingStatus = (typeof BOOKING_STATUSES)[number];
export declare const PAYMENT_STATUSES: readonly ["CREATED", "INITIATED", "PENDING_PROVIDER", "SUCCEEDED", "FAILED", "EXPIRED", "REFUNDED", "PARTIALLY_REFUNDED"];
export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];
export declare const OFFER_STATUSES: readonly ["OFFER_PENDING", "SELLER_REVIEWING", "COUNTERED", "ACCEPTED", "REJECTED", "WITHDRAWN", "EXPIRED"];
export type OfferStatus = (typeof OFFER_STATUSES)[number];
export declare const VERIFICATION_STATUSES: readonly ["UNVERIFIED", "SUBMITTED", "UNDER_REVIEW", "VERIFIED", "REJECTED"];
export type VerificationStatus = (typeof VERIFICATION_STATUSES)[number];
export declare const VERIFICATION_TYPES: readonly ["PHONE", "IDENTITY", "OWNER", "AGENCY", "PROPERTY", "DOCUMENTS", "BUSINESS"];
export type VerificationType = (typeof VERIFICATION_TYPES)[number];
export declare const RISK_LEVELS: readonly ["LOW", "MEDIUM", "HIGH", "BLOCKED"];
export type RiskLevel = (typeof RISK_LEVELS)[number];
export declare const MESSAGE_STATUSES: readonly ["SENT", "DELIVERED", "READ"];
export type MessageStatus = (typeof MESSAGE_STATUSES)[number];
export declare const MAINTENANCE_STATUSES: readonly ["OPEN", "ASSIGNED", "IN_PROGRESS", "RESOLVED", "CLOSED"];
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
export declare const DEFAULT_RANKING_WEIGHTS: RankingWeights;
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
