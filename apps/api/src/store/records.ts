import type { Role, RiskLevel } from "@imizi/types";

export interface UserRecord {
  id: string;
  email: string;
  phone: string;
  passwordHash: string;
  fullName: string;
  locale: string;
  roles: Role[];
  status: string;
  mfaEnabled: boolean;
  organizationId?: string;
  createdAt: string;
}

export interface PropertyRecord {
  id: string;
  ownerId: string;
  organizationId?: string;
  title: string;
  description: string;
  propertyType: string;
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  countryCode: string;
  verificationStatus: string;
  riskLevel: RiskLevel;
  riskScore: number;
  province: string;
  district: string;
  sector?: string;
  cell?: string;
  village?: string;
  latitude: number;
  longitude: number;
  bedrooms?: number;
  bathrooms?: number;
  parking?: number;
  areaValue?: number;
  areaUnit: string;
  amenities: string[];
  media: Array<{ id: string; kind: string; url: string; sortOrder: number }>;
  createdAt: string;
  updatedAt: string;
}

export interface UnitRecord {
  id: string;
  propertyId: string;
  label: string;
  bedrooms?: number;
  bathrooms?: number;
  parking?: number;
  status: string;
}

export interface ListingRecord {
  id: string;
  propertyId: string;
  unitId?: string;
  listingType: "RENT" | "SALE" | "SHORT_STAY";
  status: string;
  priceMinor: number;
  currency: string;
  availableFrom: string;
  createdAt: string;
  updatedAt: string;
}

export interface BookingRecord {
  id: string;
  listingId: string;
  unitId?: string;
  tenantId: string;
  status: string;
  startDate: string;
  endDate: string;
  amountMinor: number;
  depositMinor: number;
  currency: string;
  idempotencyKey: string;
  createdAt: string;
}

export interface PaymentIntentRecord {
  id: string;
  bookingId?: string;
  payerId: string;
  provider: string;
  amountMinor: number;
  currency: string;
  status: string;
  internalReference: string;
  providerReference?: string;
  checkoutUrl?: string;
  idempotencyKey: string;
  createdAt: string;
  completedAt?: string;
}
