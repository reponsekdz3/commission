"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DEFAULT_RANKING_WEIGHTS = exports.MAINTENANCE_STATUSES = exports.MESSAGE_STATUSES = exports.RISK_LEVELS = exports.VERIFICATION_TYPES = exports.VERIFICATION_STATUSES = exports.OFFER_STATUSES = exports.PAYMENT_STATUSES = exports.BOOKING_STATUSES = exports.LISTING_TYPES = exports.PROPERTY_TYPES = exports.ROLES = void 0;
exports.ROLES = [
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
];
exports.PROPERTY_TYPES = [
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
];
exports.LISTING_TYPES = ["RENT", "SALE", "SHORT_STAY"];
exports.BOOKING_STATUSES = [
    "PENDING",
    "PAYMENT_PENDING",
    "CONFIRMED",
    "ACTIVE",
    "COMPLETED",
    "CANCELLED",
    "EXPIRED",
];
exports.PAYMENT_STATUSES = [
    "CREATED",
    "INITIATED",
    "PENDING_PROVIDER",
    "SUCCEEDED",
    "FAILED",
    "EXPIRED",
    "REFUNDED",
    "PARTIALLY_REFUNDED",
];
exports.OFFER_STATUSES = [
    "OFFER_PENDING",
    "SELLER_REVIEWING",
    "COUNTERED",
    "ACCEPTED",
    "REJECTED",
    "WITHDRAWN",
    "EXPIRED",
];
exports.VERIFICATION_STATUSES = [
    "UNVERIFIED",
    "SUBMITTED",
    "UNDER_REVIEW",
    "VERIFIED",
    "REJECTED",
];
exports.VERIFICATION_TYPES = [
    "PHONE",
    "IDENTITY",
    "OWNER",
    "AGENCY",
    "PROPERTY",
    "DOCUMENTS",
    "BUSINESS",
];
exports.RISK_LEVELS = ["LOW", "MEDIUM", "HIGH", "BLOCKED"];
exports.MESSAGE_STATUSES = ["SENT", "DELIVERED", "READ"];
exports.MAINTENANCE_STATUSES = [
    "OPEN",
    "ASSIGNED",
    "IN_PROGRESS",
    "RESOLVED",
    "CLOSED",
];
exports.DEFAULT_RANKING_WEIGHTS = {
    textRelevance: 0.3,
    location: 0.25,
    filterMatch: 0.2,
    availability: 0.1,
    verified: 0.05,
    listingQuality: 0.05,
    freshness: 0.05,
};
//# sourceMappingURL=index.js.map