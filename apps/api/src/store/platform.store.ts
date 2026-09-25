import { Injectable } from "@nestjs/common";
import { randomUUID } from "crypto";
import { hashSync } from "bcryptjs";
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

@Injectable()
export class PlatformStore {
  users = new Map<string, UserRecord>();
  refreshByHash = new Map<string, { userId: string; expiresAt: number }>();
  organizations = new Map<string, { id: string; name: string; slug: string; kind: string; members: string[] }>();
  properties = new Map<string, PropertyRecord>();
  units = new Map<string, UnitRecord>();
  listings = new Map<string, ListingRecord>();
  bookings = new Map<string, BookingRecord>();
  payments = new Map<string, PaymentIntentRecord>();
  ledger: Array<{ account: string; direction: string; amountMinor: number; currency: string; reference: string }> = [];
  favorites = new Map<string, Set<string>>();
  savedSearches: Array<{ id: string; userId: string; name: string; criteria: Record<string, unknown> }> = [];
  views: Array<{ propertyId: string; userId?: string; at: string }> = [];
  conversations = new Map<string, { id: string; memberIds: string[]; propertyId?: string; bookingId?: string }>();
  messages: Array<{ id: string; conversationId: string; senderId: string; body: string; status: string; createdAt: string }> = [];
  reviews: Array<{ id: string; bookingId: string; reviewerId: string; propertyId: string; rating: number; body: string }> = [];
  verifications: Array<{ id: string; subjectType: string; subjectId: string; kind: string; status: string; evidence: unknown }> = [];
  reports: Array<{ id: string; reporterId: string; subjectType: string; subjectId: string; reason: string }> = [];
  fraudCases: Array<{ id: string; subjectId: string; score: number; level: string; signals: unknown }> = [];
  notifications: Array<{ id: string; userId: string; eventType: string; title: string; body: string; readAt?: string; createdAt: string }> = [];
  offers: Array<{ id: string; listingId: string; buyerId: string; amountMinor: number; currency: string; status: string; message?: string }> = [];
  viewings: Array<{ id: string; listingId: string; requesterId: string; slotStart: string; status: string }> = [];
  leases: Array<{ id: string; bookingId: string; terms: Record<string, unknown>; pdf: string }> = [];
  maintenance: Array<{ id: string; propertyId: string; tenantId: string; title: string; description: string; status: string }> = [];
  analytics: Array<{ name: string; userId?: string; propertyId?: string; payload: Record<string, unknown>; at: string }> = [];
  audit: Array<{ actorId?: string; action: string; subjectType: string; subjectId?: string; before?: unknown; after?: unknown; ip?: string; at: string }> = [];
  consents: Array<{ userId: string; purpose: string; granted: boolean; at: string }> = [];
  jobs: Array<{ name: string; payload: unknown; at: string; done: boolean }> = [];
  cache = new Map<string, { value: unknown; exp: number }>();

  constructor() {
    this.seed();
  }

  id(): string {
    return randomUUID();
  }

  now(): string {
    return new Date().toISOString();
  }

  auditLog(entry: Omit<(typeof this.audit)[number], "at">) {
    this.audit.push({ ...entry, at: this.now() });
  }

  notify(userId: string, eventType: string, title: string, body: string) {
    this.notifications.push({
      id: this.id(),
      userId,
      eventType,
      title,
      body,
      createdAt: this.now(),
    });
    this.jobs.push({ name: "notification.dispatch", payload: { userId, eventType, channels: ["push", "email", "sms", "in-app"] }, at: this.now(), done: false });
  }

  enqueue(name: string, payload: unknown) {
    this.jobs.push({ name, payload, at: this.now(), done: false });
  }

  cacheGet<T>(key: string): T | undefined {
    const hit = this.cache.get(key);
    if (!hit) return undefined;
    if (hit.exp < Date.now()) {
      this.cache.delete(key);
      return undefined;
    }
    return hit.value as T;
  }

  cacheSet(key: string, value: unknown, ttlMs = 60_000) {
    this.cache.set(key, { value, exp: Date.now() + ttlMs });
  }

  userByEmailOrPhone(identifier: string): UserRecord | undefined {
    return [...this.users.values()].find(
      (u) => u.email.toLowerCase() === identifier.toLowerCase() || u.phone === identifier,
    );
  }

  listingsForProperty(propertyId: string) {
    return [...this.listings.values()].filter((l) => l.propertyId === propertyId);
  }

  unitsForProperty(propertyId: string) {
    return [...this.units.values()].filter((u) => u.propertyId === propertyId);
  }

  private seed() {
    const passwordHash = hashSync("ChangeMe!2026", 10);
    const landlord: UserRecord = {
      id: "11111111-1111-1111-1111-111111111111",
      email: "landlord@imizi.rw",
      phone: "+250780000001",
      passwordHash,
      fullName: "Uwase Keza",
      locale: "rw",
      roles: ["LANDLORD", "USER"],
      status: "ACTIVE",
      mfaEnabled: false,
      createdAt: this.now(),
    };
    const tenant: UserRecord = {
      id: "22222222-2222-2222-2222-222222222222",
      email: "tenant@imizi.rw",
      phone: "+250780000002",
      passwordHash,
      fullName: "Mugisha Eric",
      locale: "en",
      roles: ["TENANT", "USER"],
      status: "ACTIVE",
      mfaEnabled: false,
      createdAt: this.now(),
    };
    const admin: UserRecord = {
      id: "33333333-3333-3333-3333-333333333333",
      email: "admin@imizi.rw",
      phone: "+250780000003",
      passwordHash,
      fullName: "Imizi Admin",
      locale: "en",
      roles: ["SUPER_ADMIN"],
      status: "ACTIVE",
      mfaEnabled: true,
      createdAt: this.now(),
    };
    const agent: UserRecord = {
      id: "44444444-4444-4444-4444-444444444444",
      email: "agent@imizi.rw",
      phone: "+250780000004",
      passwordHash,
      fullName: "Iradukunda Aline",
      locale: "fr",
      roles: ["AGENT", "AGENCY_ADMIN"],
      status: "ACTIVE",
      mfaEnabled: false,
      createdAt: this.now(),
    };
    for (const u of [landlord, tenant, admin, agent]) this.users.set(u.id, u);

    const agencyId = "55555555-5555-5555-5555-555555555555";
    this.organizations.set(agencyId, {
      id: agencyId,
      name: "Kigali Prime Agency",
      slug: "kigali-prime",
      kind: "AGENCY",
      members: [agent.id, landlord.id],
    });
    agent.organizationId = agencyId;

    const catalog: Array<Partial<PropertyRecord> & { listings: Array<{ type: ListingRecord["listingType"]; price: number }>; units?: string[] }> = [
      {
        title: "Modern House in Kigali",
        description: "Light-filled 3 bedroom family house in Kicukiro with parking, fibre internet, and a walled garden. Water and electricity are metered and reliable.",
        propertyType: "HOUSE",
        district: "Kicukiro",
        province: "Kigali",
        sector: "Kagarama",
        latitude: -1.978,
        longitude: 30.112,
        bedrooms: 3,
        bathrooms: 2,
        parking: 2,
        amenities: ["water", "electricity", "internet", "security", "parking", "furnished"],
        listings: [
          { type: "RENT", price: 900_000 },
          { type: "SALE", price: 110_000_000 },
        ],
      },
      {
        title: "Apartment Building A",
        description: "Five-unit walk-up in Gacuriro. Each unit is independently metered. Suitable for agency management or floor-by-floor rentals.",
        propertyType: "APARTMENT_BUILDING",
        district: "Gasabo",
        province: "Kigali",
        sector: "Gacuriro",
        latitude: -1.905,
        longitude: 30.114,
        amenities: ["water", "electricity", "security", "parking"],
        listings: [{ type: "RENT", price: 650_000 }],
        units: ["101", "102", "103", "104", "105"],
      },
      {
        title: "Lake-view villa near Rubavu",
        description: "Weekend villa with garden and generator backup, 12 minutes from the lake shore.",
        propertyType: "VILLA",
        district: "Rubavu",
        province: "Western",
        latitude: -1.702,
        longitude: 29.256,
        bedrooms: 4,
        bathrooms: 3,
        parking: 3,
        amenities: ["water", "electricity", "security", "parking"],
        listings: [{ type: "SHORT_STAY", price: 180_000 }],
      },
      {
        title: "Warehouse Kishenyi industrial",
        description: "1,200 sqm warehouse with truck access and 24h security, 8m eaves.",
        propertyType: "WAREHOUSE",
        district: "Gasabo",
        province: "Kigali",
        latitude: -1.93,
        longitude: 30.14,
        areaValue: 1200,
        amenities: ["security", "electricity", "parking"],
        listings: [{ type: "RENT", price: 3_200_000 }],
      },
      {
        title: "Plot in Musanze",
        description: "Titled residential land with road access, 18 minutes from Volcanoes National Park gates.",
        propertyType: "LAND",
        district: "Musanze",
        province: "Northern",
        latitude: -1.4998,
        longitude: 29.635,
        areaValue: 800,
        amenities: [],
        listings: [{ type: "SALE", price: 45_000_000 }],
      },
    ];

    const photos = [
      "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&w=1600",
      "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&w=1600",
      "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&w=1600",
      "https://images.unsplash.com/photo-1505691938895-1758d7feb511?auto=format&w=1600",
    ];

    catalog.forEach((item, index) => {
      const id = randomUUID();
      const property: PropertyRecord = {
        id,
        ownerId: landlord.id,
        organizationId: index === 1 ? agencyId : undefined,
        title: item.title!,
        description: item.description!,
        propertyType: item.propertyType!,
        status: "PUBLISHED",
        countryCode: "RW",
        verificationStatus: index < 3 ? "VERIFIED" : "UNVERIFIED",
        riskLevel: "LOW",
        riskScore: 4,
        province: item.province!,
        district: item.district!,
        sector: item.sector,
        latitude: item.latitude!,
        longitude: item.longitude!,
        bedrooms: item.bedrooms,
        bathrooms: item.bathrooms,
        parking: item.parking,
        areaValue: item.areaValue,
        areaUnit: "SQM",
        amenities: item.amenities ?? [],
        media: photos.map((url, i) => ({ id: randomUUID(), kind: "PHOTO", url, sortOrder: i })),
        createdAt: this.now(),
        updatedAt: this.now(),
      };
      this.properties.set(id, property);
      for (const label of item.units ?? []) {
        const unitId = randomUUID();
        this.units.set(unitId, {
          id: unitId,
          propertyId: id,
          label,
          bedrooms: 2,
          bathrooms: 1,
          parking: 1,
          status: "AVAILABLE",
        });
      }
      for (const listing of item.listings) {
        const listingId = randomUUID();
        this.listings.set(listingId, {
          id: listingId,
          propertyId: id,
          listingType: listing.type,
          status: "ACTIVE",
          priceMinor: listing.price,
          currency: "RWF",
          availableFrom: this.now(),
          createdAt: this.now(),
          updatedAt: this.now(),
        });
      }
    });

    this.savedSearches.push({
      id: randomUUID(),
      userId: tenant.id,
      name: "Kicukiro 2-3 bed under 900k",
      criteria: { district: "Kicukiro", bedroomsMin: 2, bedroomsMax: 3, maxPriceMinor: 900_000, listingType: "RENT" },
    });
    this.verifications.push({
      id: randomUUID(),
      subjectType: "property",
      subjectId: [...this.properties.keys()][0],
      kind: "PROPERTY",
      status: "UNDER_REVIEW",
      evidence: { note: "Title scan queued" },
    });
  }
}
