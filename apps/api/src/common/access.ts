import { ForbiddenException } from "@nestjs/common";
import { canReadProperty, hasPermission, type Permission } from "@imizi/domain";
import type { UserRecord } from "../store/platform.store";
import type { PropertyRecord } from "../store/platform.store";

export function assertPermission(user: UserRecord, permission: Permission) {
  if (!hasPermission(user.roles, permission)) {
    throw new ForbiddenException("Insufficient role permission");
  }
}

export function assertPropertyAccess(user: UserRecord | undefined, property: PropertyRecord, write = false) {
  if (!write) {
    const allowed = canReadProperty({
      actorId: user?.id,
      actorRoles: user?.roles ?? ["USER"],
      ownerId: property.ownerId,
      published: property.status === "PUBLISHED",
      organizationId: property.organizationId,
      actorOrganizationId: user?.organizationId,
    });
    if (!allowed) throw new ForbiddenException("No access to this property");
    return;
  }
  if (!user) throw new ForbiddenException("Authentication required");
  const owner = user.id === property.ownerId;
  const org = property.organizationId && property.organizationId === user.organizationId;
  const admin = user.roles.some((r) => ["SUPER_ADMIN", "ADMIN"].includes(r));
  if (!owner && !org && !admin) throw new ForbiddenException("Object-level authorization failed");
}
