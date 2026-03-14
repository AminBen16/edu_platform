import { defineConfig } from '@prisma/internals'
 
export default defineConfig({
  datasource: {
    url: env('DATABASE_URL'),
  },
  __internal: {
    schemaPath: './schema.prisma',
  },
})

