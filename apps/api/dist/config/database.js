"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.prisma = void 0;
// Re-export Prisma client from packages/db
// This ensures a single instance is used across the application
const db_1 = require("db");
Object.defineProperty(exports, "prisma", { enumerable: true, get: function () { return db_1.prisma; } });
exports.default = db_1.prisma;
