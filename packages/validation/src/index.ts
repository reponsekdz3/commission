import { z } from "zod";

export const paginationSchema = z.object({
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(50).optional(),
});

export const registerSchema = z.object({
  email: z.string().email(),
  phone: z.string().min(10).max(20),
  password: z.string().min(10).max(128),
  fullName: z.string().min(2).max(120),
  locale: z.enum(["rw", "en", "fr"]).default("rw"),
});

export const loginSchema = z.object({
  identifier: z.string().min(3),
  password: z.string().min(1),
});

export const createPropertySchema = z.object({
  title: z.string().min(5).max(180),
  description: z.string().min(20).max(20_000),
  propertyType: z.enum([
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
  ]),
  countryCode: z.enum(["RW", "UG", "KE", "TZ"]).default("RW"),
  province: z.string(),
  district: z.string(),
  sector: z.string().optional(),
  cell: z.string().optional(),
  village: z.string().optional(),
  latitude: z.number().gte(-90).lte(90),
  longitude: z.number().gte(-180).lte(180),
  bedrooms: z.number().int().min(0).max(50).optional(),
  bathrooms: z.number().int().min(0).max(50).optional(),
  parking: z.number().int().min(0).max(100).optional(),
  areaValue: z.number().positive().optional(),
  areaUnit: z.enum(["SQM", "HA", "SQFT"]).default("SQM"),
  amenities: z.array(z.string()).default([]),
  organizationId: z.string().uuid().optional(),
});

export const createListingSchema = z.object({
  propertyId: z.string().uuid(),
  unitId: z.string().uuid().optional(),
  listingType: z.enum(["RENT", "SALE", "SHORT_STAY"]),
  priceMinor: z.number().int().positive(),
  currency: z.enum(["RWF", "USD", "KES", "UGX", "TZS"]).default("RWF"),
  availableFrom: z.string().datetime().optional(),
});

export const createBookingSchema = z.object({
  listingId: z.string().uuid(),
  unitId: z.string().uuid().optional(),
  startDate: z.string(),
  endDate: z.string(),
  guests: z.number().int().min(1).max(20).default(1),
  idempotencyKey: z.string().min(8),
});

export const initiatePaymentSchema = z.object({
  bookingId: z.string().uuid().optional(),
  offerId: z.string().uuid().optional(),
  provider: z.enum(["MTN_MOMO", "FLUTTERWAVE", "CARD"]),
  msisdn: z.string().optional(),
  idempotencyKey: z.string().min(8),
});

export const searchSchema = paginationSchema.extend({
  q: z.string().optional(),
  listingType: z.enum(["RENT", "SALE", "SHORT_STAY"]).optional(),
  propertyType: z.string().optional(),
  district: z.string().optional(),
  province: z.string().optional(),
  bedroomsMin: z.coerce.number().int().optional(),
  bedroomsMax: z.coerce.number().int().optional(),
  maxPriceMinor: z.coerce.number().int().optional(),
  minPriceMinor: z.coerce.number().int().optional(),
  radiusKm: z.coerce.number().positive().max(50).optional(),
  lat: z.coerce.number().optional(),
  lng: z.coerce.number().optional(),
  north: z.coerce.number().optional(),
  south: z.coerce.number().optional(),
  east: z.coerce.number().optional(),
  west: z.coerce.number().optional(),
  verifiedOnly: z.coerce.boolean().optional(),
  amenities: z.string().optional(),
  availableNow: z.coerce.boolean().optional(),
});

export const offerSchema = z.object({
  listingId: z.string().uuid(),
  amountMinor: z.number().int().positive(),
  currency: z.enum(["RWF", "USD", "KES", "UGX", "TZS"]).default("RWF"),
  message: z.string().max(2000).optional(),
});

export const messageSchema = z.object({
  conversationId: z.string().uuid().optional(),
  propertyId: z.string().uuid().optional(),
  bookingId: z.string().uuid().optional(),
  offerId: z.string().uuid().optional(),
  recipientId: z.string().uuid().optional(),
  body: z.string().min(1).max(8000),
});
