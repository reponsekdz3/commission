import { ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { scoreFraud, shouldQueueForModeration } from "@imizi/domain";
import { PlatformStore, PropertyRecord, UserRecord } from "../../store/platform.store";
import { assertPermission, assertPropertyAccess } from "../../common/access";

@Injectable()
export class PropertiesService {
  constructor(private readonly store: PlatformStore) {}

  create(user: UserRecord, input: Record<string, any>) {
    assertPermission(user, "property:create");
    const id = this.store.id();
    const property: PropertyRecord = {
      id,
      ownerId: user.id,
      organizationId: input.organizationId ?? user.organizationId,
      title: input.title,
      description: input.description,
      propertyType: input.propertyType,
      status: "DRAFT",
      countryCode: input.countryCode ?? "RW",
      verificationStatus: "UNVERIFIED",
      riskLevel: "LOW",
      riskScore: 0,
      province: input.province,
      district: input.district,
      sector: input.sector,
      cell: input.cell,
      village: input.village,
      latitude: input.latitude,
      longitude: input.longitude,
      bedrooms: input.bedrooms,
      bathrooms: input.bathrooms,
      parking: input.parking,
      areaValue: input.areaValue,
      areaUnit: input.areaUnit ?? "SQM",
      amenities: input.amenities ?? [],
      media: [],
      createdAt: this.store.now(),
      updatedAt: this.store.now(),
    };
    const fraud = scoreFraud({
      listingsLast24h: [...this.store.properties.values()].filter((p) => p.ownerId === user.id).length,
      duplicatePhotoHits: 0,
      priceVsMedianRatio: 1,
      reportCount: 0,
      accountsFromSameDeviceLastHour: 0,
      paymentAnomalyScore: 0,
      fakeContactScore: 0,
      duplicatePropertyScore: 0,
      locationMismatchScore: 0,
    });
    property.riskLevel = fraud.level;
    property.riskScore = fraud.score;
    this.store.properties.set(id, property);
    if (shouldQueueForModeration(fraud.level)) {
      this.store.fraudCases.push({ subjectId: id, score: fraud.score, level: fraud.level, signals: fraud });
    }
    this.store.enqueue("search.index", { propertyId: id });
    this.store.auditLog({ actorId: user.id, action: "PROPERTY_CREATED", subjectType: "property", subjectId: id });
    return this.hydrate(property);
  }

  get(id: string, user?: UserRecord) {
    const property = this.store.properties.get(id);
    if (!property) throw new NotFoundException("Property not found");
    assertPropertyAccess(user, property, false);
    this.store.views.push({ propertyId: id, userId: user?.id, at: this.store.now() });
    this.store.analytics.push({ name: "property_viewed", userId: user?.id, propertyId: id, payload: {}, at: this.store.now() });
    return this.hydrate(property);
  }

  update(id: string, user: UserRecord, patch: Record<string, any>) {
    const property = this.store.properties.get(id);
    if (!property) throw new NotFoundException();
    assertPropertyAccess(user, property, true);
    Object.assign(property, patch, { updatedAt: this.store.now() });
    this.store.enqueue("search.index", { propertyId: id });
    return this.hydrate(property);
  }

  publish(id: string, user: UserRecord) {
    const property = this.store.properties.get(id);
    if (!property) throw new NotFoundException();
    assertPropertyAccess(user, property, true);
    if (property.riskLevel === "BLOCKED") throw new ForbiddenException("Listing is blocked pending review");
    property.status = "PUBLISHED";
    property.updatedAt = this.store.now();
    this.matchSavedSearches(property);
    this.store.enqueue("search.index", { propertyId: id });
    return this.hydrate(property);
  }

  hydrate(property: PropertyRecord) {
    return {
      ...property,
      units: this.store.unitsForProperty(property.id),
      listings: this.store.listingsForProperty(property.id),
      views: this.store.views.filter((v) => v.propertyId === property.id).length,
      nearbyHint: { district: property.district, province: property.province },
    };
  }

  private matchSavedSearches(property: PropertyRecord) {
    const listings = this.store.listingsForProperty(property.id);
    for (const saved of this.store.savedSearches) {
      const criteria = saved.criteria;
      const listing = listings[0];
      if (!listing) continue;
      const districtOk = !criteria.district || criteria.district === property.district;
      const typeOk = !criteria.propertyType || criteria.propertyType === property.propertyType;
      const priceOk = !criteria.maxPriceMinor || listing.priceMinor <= Number(criteria.maxPriceMinor);
      if (districtOk && typeOk && priceOk) {
        this.store.notify(saved.userId, "NEW_MATCHING_PROPERTY", "New property matching your search", property.title);
      }
    }
  }
}
