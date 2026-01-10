# QUICK PRODUCTION DATABASE SETUP

## 1. Use Neon (Free PostgreSQL)
```bash
# Install Prisma CLI
npm i -g prisma

# Create Neon database
# Go to: https://neon.tech/signup
# Create new project → Get connection string

# Set environment variable
export DATABASE_URL="postgresql://username:password@ep-xxx-xxx.us-east-1.aws.neon.tech/dbname?sslmode=require"

# Generate Prisma client
cd packages/db
npx prisma generate

# Push schema to database
npx prisma db push
```

## 2. Update Environment Variables
In Vercel Dashboard → Project Settings → Environment Variables:
```
DATABASE_URL=your-neon-connection-string
NEXTAUTH_SECRET=your-super-secret-jwt-key
```

## 3. Restore Real Database Routes
Replace mock routes with real Prisma queries in:
- `apps/api/src/routes/lessons.ts`
- `apps/api/src/routes/exams.ts` 
- `apps/api/src/routes/auth.ts`
- `apps/api/src/routes/users.ts`

## 4. Redeploy
```bash
cd apps/api
vercel --prod
```

### BENEFITS
✅ Real data persistence  
✅ Multi-school isolation  
✅ Proper user management  
✅ Scalable database  
✅ Production-ready architecture
