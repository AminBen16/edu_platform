"use strict";
// @ts-ignore Cannot find module '@prisma/internals' (internal package, ignore)\nimport { defineConfig } from '@prisma/internals'
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = defineConfig({
    generator: {
        previewFeatures: ['driverAdapters']
    },
});
