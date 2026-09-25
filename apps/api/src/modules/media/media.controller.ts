import { Body, Controller, Post } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { Throttle } from "@nestjs/throttler";
import { CurrentUser } from "../../common/current-user.decorator";
import { PlatformStore, UserRecord } from "../../store/platform.store";
import { assertPropertyAccess } from "../../common/access";

@ApiTags("media")
@ApiBearerAuth()
@Controller("media")
export class MediaController {
  constructor(private readonly store: PlatformStore) {}

  @Throttle({ upload: { limit: 15, ttl: 60_000 } })
  @Post("signed-url")
  signed(
    @CurrentUser() user: UserRecord,
    @Body() body: { propertyId: string; filename: string; contentType: string; kind: "PHOTO" | "VIDEO" | "DOCUMENT" },
  ) {
    const property = this.store.properties.get(body.propertyId);
    if (!property) return { error: "not_found" };
    assertPropertyAccess(user, property, true);
    const allowed = ["image/jpeg", "image/png", "image/webp", "video/mp4", "application/pdf"];
    if (!allowed.includes(body.contentType)) return { error: "file_type_rejected" };
    const key = `property/${body.propertyId}/original/${this.store.id()}-${body.filename}`;
    this.store.enqueue("media.process", {
      key,
      variants: ["thumbnail", "small", "medium", "large", "webp"],
      exifCleanup: true,
      malwareScan: true,
    });
    return {
      uploadUrl: `https://storage.local/upload/${key}`,
      key,
      publicUrl: null,
      private: body.kind === "DOCUMENT",
    };
  }

  @Post("complete")
  complete(@CurrentUser() user: UserRecord, @Body() body: { propertyId: string; key: string; kind: string }) {
    const property = this.store.properties.get(body.propertyId);
    if (!property) return { error: "not_found" };
    assertPropertyAccess(user, property, true);
    property.media.push({
      id: this.store.id(),
      kind: body.kind,
      url: `/cdn/${body.key}`,
      sortOrder: property.media.length,
    });
    return property.media;
  }
}
