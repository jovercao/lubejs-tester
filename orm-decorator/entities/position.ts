import { DB } from "../index";
import {
  column,
  comment,
  context,
  data,
  Entity,
  EntityKey,
  identity,
  key,
  manyToMany,
  nullable,
  table,
} from "lubejs";
import { Employee } from "./employee";

@table()
@comment("Position")
@context(() => DB)
@data([
  { id: 1, name: "general manager", description: "none" },
  { id: 2, name: "chief inspector", description: "none" },
  { id: 3, name: "clerk", description: "none" },
])
export class Position extends Entity implements EntityKey {
  @column()
  @comment("PositionID")
  @identity()
  @key()
  id?: bigint;

  @comment("PositionName")
  @column()
  name!: string;

  @column()
  @comment("Description")
  @nullable()
  description?: string;

  @manyToMany(() => Employee, (p) => p.positions)
  employees?: Employee[];
}
