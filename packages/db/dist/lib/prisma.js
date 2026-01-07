"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// apps/api/src/lib/prisma.ts
const db_1 = require("db");
let prisma;
// This is needed because in development we don't want to restart
// the server with every change, but we want to make sure we don't
// create a new connection to the DB with every change.
if (process.env.NODE_ENV === 'production') {
    prisma = new db_1.PrismaClient();
}
else {
    if (!global.__prisma) {
        global.__prisma = new db_1.PrismaClient();
    }
    prisma = global.__prisma;
}
exports.default = prisma;
