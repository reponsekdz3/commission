import { Body, Controller, Get, Param, Post } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { transitionVerification } from "@imizi/domain";
import { CurrentUser } from "../../common/current-user.decorator";
import { PlatformStore, UserRecord } from "../../store/platform.store";

@ApiTags("verification")
@Controller("verification")
export class VerificationController {
  constructor(private readonly store: PlatformStore) {}

  @ApiBearerAuth()
  @Post()
  submit(
    @CurrentUser() user: UserRecord,
    @Body() body: { subjectType: string; subjectId: string; kind: string; evidence?: unknown },
  ) {
    const request = {
      id: this.store.id(),
      ...body,
      status: transitionVerification("UNVERIFIED", "SUBMITTED"),
      evidence: body.evidence ?? {},
    };
    request.status = transitionVerification("SUBMITTED", "UNDER_REVIEW");
    this.store.verifications.push(request);
    return request;
  }

  @ApiBearerAuth()
  @Post(":id/decide")
  decide(@CurrentUser() user: UserRecord, @Param("id") id: string, @Body() body: { accept: boolean }) {
    if (!user.roles.includes("VERIFICATION_AGENT") && !user.roles.includes("SUPER_ADMIN") && !user.roles.includes("ADMIN")) {
      return { error: "forbidden" };
    }
    const request = this.store.verifications.find((v) => v.id === id);
    if (!request) return { error: "not_found" };
    request.status = transitionVerification(request.status as any, body.accept ? "VERIFIED" : "REJECTED");
    if (request.subjectType === "property" && body.accept) {
      const property = this.store.properties.get(request.subjectId);
      if (property) property.verificationStatus = "VERIFIED";
    }
    this.store.auditLog({
      actorId: user.id,
      action: body.accept ? "PROPERTY_VERIFIED" : "VERIFICATION_REJECTED",
      subjectType: request.subjectType,
      subjectId: request.subjectId,
      before: { status: "UNDER_REVIEW" },
      after: { status: request.status },
    });
    return request;
  }

  @Get()
  list() {
    return this.store.verifications;
  }
}
