import type { Role } from "@imizi/types";

export type Permission =
  | "property:create"
  | "property:update"
  | "property:delete"
  | "listing:publish"
  | "booking:create"
  | "booking:manage"
  | "payment:refund"
  | "payout:change"
  | "verification:review"
  | "moderation:queue"
  | "admin:access"
  | "finance:access"
  | "agency:manage"
  | "message:send"
  | "review:create"
  | "maintenance:manage"
  | "account:change-contact"
  | "mfa:manage";

const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  SUPER_ADMIN: [
    "property:create","property:update","property:delete","listing:publish","booking:create","booking:manage",
    "payment:refund","payout:change","verification:review","moderation:queue","admin:access","finance:access",
    "agency:manage","message:send","review:create","maintenance:manage","account:change-contact","mfa:manage",
  ],
  ADMIN: [
    "admin:access","moderation:queue","verification:review","property:delete","booking:manage","message:send",
    "account:change-contact","mfa:manage",
  ],
  MODERATOR: ["moderation:queue","admin:access","message:send"],
  VERIFICATION_AGENT: ["verification:review","admin:access"],
  FINANCE_ADMIN: ["finance:access","payment:refund","payout:change","admin:access","account:change-contact","mfa:manage"],
  USER: ["booking:create","message:send","account:change-contact","mfa:manage"],
  TENANT: ["booking:create","message:send","review:create","account:change-contact","mfa:manage"],
  BUYER: ["booking:create","message:send","account:change-contact","mfa:manage"],
  LANDLORD: ["property:create","property:update","listing:publish","booking:manage","message:send","maintenance:manage","account:change-contact","mfa:manage"],
  SELLER: ["property:create","property:update","listing:publish","message:send","account:change-contact","mfa:manage"],
  AGENT: ["property:create","property:update","listing:publish","booking:manage","message:send","account:change-contact","mfa:manage"],
  AGENCY_ADMIN: ["property:create","property:update","listing:publish","booking:manage","agency:manage","message:send","account:change-contact","mfa:manage"],
  PROPERTY_MANAGER: ["booking:manage","maintenance:manage","property:update","message:send","account:change-contact","mfa:manage"],
};

export function hasPermission(roles: Role[], permission: Permission): boolean {
  return roles.some((role) => ROLE_PERMISSIONS[role]?.includes(permission));
}

export interface ResourceAccessInput {
  actorId: string;
  actorRoles: Role[];
  ownerId?: string;
  organizationId?: string;
  actorOrganizationId?: string;
  isPublic?: boolean;
  permission: Permission;
}

export function authorizeResource(input: ResourceAccessInput): boolean {
  if (hasPermission(input.actorRoles, "admin:access") && hasPermission(input.actorRoles, input.permission)) return true;
  if (input.actorRoles.includes("SUPER_ADMIN")) return true;
  if (input.ownerId && input.ownerId === input.actorId) return hasPermission(input.actorRoles, input.permission);
  if (input.organizationId && input.organizationId === input.actorOrganizationId) return hasPermission(input.actorRoles, input.permission);
  return Boolean(input.isPublic) && hasPermission(input.actorRoles, input.permission);
}

export function canReadProperty(input: {
  actorId?: string;
  actorRoles: Role[];
  ownerId: string;
  published: boolean;
  organizationId?: string;
  actorOrganizationId?: string;
}): boolean {
  if (input.published) return true;
  if (!input.actorId) return false;
  if (input.actorId === input.ownerId) return true;
  if (input.organizationId && input.organizationId === input.actorOrganizationId) return true;
  return input.actorRoles.some((r) => ["SUPER_ADMIN", "ADMIN", "MODERATOR", "VERIFICATION_AGENT"].includes(r));
}

export const SENSITIVE_ACTIONS = [
  "payout:change",
  "payment:refund",
  "property:delete",
  "account:change-phone",
  "account:change-email",
  "account:change-contact",
  "ownership:change",
  "mfa:manage",
] as const;

export function requiresReauth(action: string): boolean {
  return (SENSITIVE_ACTIONS as readonly string[]).includes(action);
}
