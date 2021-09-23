import { DB } from "../index";
import {
  column,
  comment,
  context,
  Entity,
  EntityKey,
  foreignKey,
  identity,
  key,
  manyToOne,
  nullable,
  oneToMany,
  table,
  detail,
  data
} from "lubejs";
import { Employee } from "./employee";

@table()
@comment("Organization")
@context(() => DB)
@data([
  { id: 0, name: "Company", description: "none" },
  { id: 1, name: "IT", parentId: 0 },
  { id: 2, name: "Administration", parentId: 0 },
])
export class Organization extends Entity implements EntityKey {
  @column()
  @key()
  @comment("OrganizationID")
  @identity()
  id?: bigint;

  @comment("OrganizationName")
  @column()
  name!: string;

  @column()
  @comment("Description")
  @nullable()
  description?: string;

  @comment("ParentOrganizationID")
  @column()
  parentId?: bigint;

  @foreignKey("parentId")
  @manyToOne(() => Organization, (p) => p.children)
  parent?: Organization;

  @detail()
  @oneToMany(() => Organization, (p) => p.parent)
  children?: Organization[];

  @oneToMany(() => Employee, (p) => p.organization)
  employees?: Employee[];
}
