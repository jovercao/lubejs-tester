import { readdir, rm } from "fs/promises";
import {
  MigrateCli,
  DbContext,
  compareSchema,
  DatabaseSchema,
  generateSchema,
  SQL,
  outputCommand,
} from "lubejs";
import assert from "power-assert";
import { join } from "path";
import { existsSync, mkdirSync } from "fs";

describe("Migrate", function () {
  let cli: MigrateCli;
  let dbContext: DbContext;
  // let defaultSchema: string;
  this.timeout(0);
  before(async () => {
    cli = await new MigrateCli();
    dbContext = cli.dbContext;
    dbContext.connection.on('command', (cmd) => outputCommand(cmd, process.stdout));
    const migrateDir = join(process.cwd(), "migrates");
    if (!existsSync(migrateDir)) {
      mkdirSync(migrateDir);
    }
    // try {
    //   defaultSchema = await cli.getDefaultSchema();
    // } catch (error) {
    //   console.error(error);
    // }
  });

  after(async () => {
    await cli.dispose();
  });

  it("Add & Snapshot", async () => {
    const files = await readdir(cli.migrateDir);
    for (const file of files) {
      await rm(join(cli.migrateDir, file));
    }
    const initMigrate = await cli.add("Init");
    await cli.snapshotAll();
    const initSchema: DatabaseSchema = (await import(initMigrate.snapshotPath))
      .default;
    const metadataSchema = generateSchema(dbContext);
    // metadataSchema.tables.forEach(table => table.seedData = undefined);
    // if (initDiff) {
    //   const databaseChanged = Object.keys(initDiff.changes!);
    //   assert(databaseChanged.length === 1 && databaseChanged[0] === 'tables');
    //   assert(initDiff.changes!.tables!.addeds.length === 0);
    //   assert(initDiff.changes!.tables!.removeds.length === 0);
    //   const tableChanged = Object.keys(initDiff.changes!.tables!.changes[0].changes!);
    //   assert(tableChanged.length = 1 && tableChanged[0] === 'seedData');
    // }

    const initDiff = compareSchema(undefined, initSchema, metadataSchema);
    assert(!initDiff);
    const addedMigrate = await cli.add();
    await cli.snapshotAll();
    const addSchema = (await import(addedMigrate.snapshotPath)).default;
    const addDiff = compareSchema(undefined, initSchema, addSchema);
    assert(!addDiff);
  });

  it("Update", async () => {
    await cli.dropDatabase();
    await cli.update("Init");
    const migrate = await cli.getDbMigrate();

    assert(migrate?.name === "Init");
    const dbSchema = await cli.getDbSchema();
    assert(dbSchema);
    const metadataSchema = generateSchema(dbContext);
    // metadataSchema.tables.forEach(table => table.seedData = undefined);
    const difference = compareSchema(
      cli.targetSchemaName,
      metadataSchema,
      dbSchema
    );
    assert(!difference);
  });

  it("Sync", async () => {
    await cli.dropDatabase();
    await cli.sync();
    const dbSchema = await cli.getDbSchema();
    assert(dbSchema);
    const metadataSchema = generateSchema(dbContext);
    const difference = compareSchema(
      cli.targetSchemaName,
      metadataSchema,
      dbSchema
    );
    assert(!difference);
  });

  it("Script", async () => {
    await cli.script({
      start: "?",
      end: "*",
    });
    // await cli.dropDatabase();
  });
});
