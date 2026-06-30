"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.config = void 0;
const _lubejs_driver_1 = __importDefault(require("@lubejs-driver"));
require("@orm");
// import 'orm';
// declare module '@jovercao/mssql' = import('mssql')
const host = process.env.LUBEJS_TEST_HOST || 'localhost';
// 各方言默认端口与用户
const dialect = _lubejs_driver_1.default.dialect;
const defaultPort = dialect === 'mysql' ? 3306 : dialect === 'pgsql' ? 5432 : dialect === 'sqlite' ? 0 : 1433;
const defaultUser = dialect === 'mysql' ? 'root' : dialect === 'pgsql' ? 'postgres' : dialect === 'sqlite' ? '' : 'sa';
const port = Number(process.env.LUBEJS_TEST_PORT || defaultPort);
const user = process.env.LUBEJS_TEST_USER || defaultUser;
const password = dialect === 'sqlite' ? undefined : (process.env.LUBEJS_TEST_PASSWORD || 'Lubejs@Test123');
const database = dialect === 'sqlite'
    ? (process.env.LUBEJS_TEST_SQLITE_DB || 'file::memory:?cache=shared')
    : 'lubejs-orm-test';
exports.config = {
    defaultConnection: 'DB',
    defaultPool: 'default',
    migrateDir: 'migrates',
    connections: {
        DB: Object.assign({
            dialect: _lubejs_driver_1.default.dialect
        }, dialect !== 'sqlite' ? { host, user, password, port } : {}, {
            database,
        }),
        // 连接名保留 mssql-core-test（测试文件硬编码引用），其指向随当前 driver 切换
        'mssql-core-test': Object.assign({
            dialect: _lubejs_driver_1.default.dialect
        }, dialect !== 'sqlite' ? { host, user, password, port } : {}, {
            database: dialect === 'sqlite' ? 'file::memory:?cache=shared' : 'lubejs-core-test-db',
        }),
    },
    pools: {
        default: {
            min: 5,
            max: 10,
            connectTimeout: 30000,
            idleTimeout: 15000,
            connection: 'mssql-core-test'
        }
    }
};
exports.default = exports.config;
//# sourceMappingURL=.lubejs.js.map