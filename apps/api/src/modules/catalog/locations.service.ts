import { BadRequestException, Injectable } from "@nestjs/common";
import { DatabaseService } from "../../infra/database.service";

type Level = "PROVINCE" | "DISTRICT" | "SECTOR" | "CELL" | "VILLAGE";
const CHILD: Record<Level, Level | undefined> = {
  PROVINCE: "DISTRICT",
  DISTRICT: "SECTOR",
  SECTOR: "CELL",
  CELL: "VILLAGE",
  VILLAGE: undefined,
};

@Injectable()
export class LocationsService {
  constructor(private readonly db: DatabaseService) {}

  async list(level: Level, parentId?: string) {
    if (level === "PROVINCE" && parentId) throw new BadRequestException("Province has no parent");
    if (level !== "PROVINCE" && !parentId) throw new BadRequestException("parentId is required");
    const result = await this.db.query(
      "SELECT id,level,code,name,parent_id AS \"parentId\" FROM rwanda_admin_units WHERE level=$1 AND active=true " +
      (parentId ? "AND parent_id=$2 " : "") +
      "ORDER BY normalized_name",
      parentId ? [level, parentId] : [level],
    );
    return result.rows;
  }

  async hierarchy() {
    const result = await this.db.query(
      "SELECT id,level,code,name,parent_id AS \"parentId\" FROM rwanda_admin_units WHERE active=true ORDER BY level,normalized_name",
    );
    return result.rows;
  }

  async validate(input: {provinceId?: string;districtId?: string;sectorId?: string;cellId?: string;villageId?: string}) {
    const ids = [input.provinceId,input.districtId,input.sectorId,input.cellId,input.villageId].filter(Boolean) as string[];
    if (!ids.length) return null;
    const result = await this.db.query(
      "SELECT id,level,code,name,parent_id FROM rwanda_admin_units WHERE id = ANY($1::uuid[]) AND active=true",
      [ids],
    );
    const byId = new Map(result.rows.map((r:any) => [String(r.id), r]));
    const expected: Array<[keyof typeof input,Level,Level | undefined]> = [
      ["provinceId","PROVINCE",undefined],["districtId","DISTRICT","PROVINCE"],["sectorId","SECTOR","DISTRICT"],
      ["cellId","CELL","SECTOR"],["villageId","VILLAGE","CELL"],
    ];
    for (const [key, level, parentLevel] of expected) {
      const id = input[key];
      if (!id) continue;
      const row = byId.get(id);
      if (!row || row.level !== level) throw new BadRequestException(`Invalid Rwanda ${level.toLowerCase()} location`);
      if (parentLevel) {
        const parentKey = expected.find(x => x[1] === parentLevel)?.[0];
        const parentId = parentKey ? input[parentKey] : undefined;
        if (!parentId || String(row.parent_id) !== String(parentId)) {
          throw new BadRequestException(`Location hierarchy is invalid: ${level} must belong to its parent`);
        }
      }
    }
    return result.rows;
  }
}
