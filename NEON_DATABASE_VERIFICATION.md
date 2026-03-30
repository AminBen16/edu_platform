# Neon Database & API Production Verification Checklist

## Current Status: ⚠️ INCOMPLETE - NEXTAUTH_SECRET Missing

### What's Working ✅
- ✅ Admin app deployed on Vercel (https://admin-chi-steel.vercel.app)
- ✅ API app deployed on Vercel (https://api-ainamanipro.vercel.app)
- ✅ Database connection details configured (DATABASE_URL, POSTGRES_PRISMA_URL, etc.)
- ✅ Neon environment variables set (POSTGRES_HOST, POSTGRES_DATABASE, POSTGRES_USER, etc.)

### What Needs Fixing ❌
- ❌ NEXTAUTH_SECRET not set in Vercel environment variables
  - This is REQUIRED for API to start
  - Minimum 32 characters
  - Controls JWT token signing

---

## Quick Setup (5 minutes)

### Step 1: Set NEXTAUTH_SECRET in Vercel
```
URL: https://vercel.com/dashboard
1. Select "api" project
2. Settings → Environment Variables
3. Add Variable:
   Name:  NEXTAUTH_SECRET
   Value: aB3cD4eF5gH6iJ7kL8mN9oPqRsTuVwXyZ0abc123
          (or generate at https://generate-secret.vercel.app/32)
4. Select: Production ✓ Preview ✓ Development ✓
5. Click "Save"
```

### Step 2: Redeploy API
```
1. Go to Deployments tab
2. Click "Redeploy" on latest deployment
3. Wait ~30 seconds for build to complete
```

### Step 3: Verify Database Connection
After redeploy, test these endpoints:
```
✅ Health Check: GET /api/health
   Should return: { status: "healthy", database: "connected" }
   
✅ API Info:     GET /api/v1
   Should return: { message: "API v1 available", version: "1.0.0" }
   
✅ Root Health:  GET /health
   Should return: Health status JSON
```

---

## Neon Database Verification

### What to Check in Neon Console
1. Go to https://console.neon.tech
2. Select your project
3. Verify:
   - [ ] Database name (should be in DATABASE_URL)
   - [ ] PostgreSQL version (13+)
   - [ ] Connection pooling enabled
   - [ ] SSL mode: require

### Database Connection String Format
```
postgresql://[user]:[password]@[host]/[database]?sslmode=require
```

### Verify in Vercel
```
vercel env list
Look for:
- DATABASE_URL ✓
- POSTGRES_PRISMA_URL ✓
- POSTGRES_HOST ✓
- POSTGRES_DATABASE ✓
- POSTGRES_USER ✓
```

---

## Testing Procedure (After NEXTAUTH_SECRET is Set)

### Test 1: Database Connectivity
```bash
curl https://api-ainamanipro.vercel.app/api/health

Expected Response (200 OK):
{
  "status": "healthy ✅",
  "database": "connected",
  "timestamp": "2026-03-30T...",
  "routes": "ALL mounted (25+)"
}
```

### Test 2: Prisma Client Generation
The API automatically regenerates Prisma client during build.
Check Vercel logs for:
```
✅ Generated Prisma Client (v5.22.0)
```

### Test 3: Database Schema
Once connected, verify Prisma schema matches Neon database:
- [ ] Tables exist (School, User, Class, etc.)
- [ ] Enums are defined (UserRole, SchoolType, etc.)
- [ ] Foreign keys work

---

## Environment Variables Needed

### Critical (API Won't Start Without These)
```
NEXTAUTH_SECRET = "your-32-char-secret-here" ← SET THIS NOW
DATABASE_URL = "postgresql://..." ← Already Set ✓
```

### Recommended
```
NODE_ENV = "production"
API_PORT = "3000"
CORS_ALLOWED_ORIGINS = "https://admin-chi-steel.vercel.app,https://yourdomain.com"
JWT_SECRET = (can be same as NEXTAUTH_SECRET)
```

---

## Common Issues & Solutions

### Issue: API returns 401 Unauthorized
**Cause:** NEXTAUTH_SECRET not set
**Solution:** Set it in Vercel Environment Variables and redeploy

### Issue: Database connection timeout
**Cause:** DATABASE_URL wrong or Neon connection pooling disabled
**Solution:** 
1. Check DATABASE_URL in Vercel
2. Verify Neon pooler is enabled
3. Check network access rules

### Issue: Prisma client generation fails
**Cause:** DATABASE_URL connection string invalid
**Solution:**
1. Verify format: postgresql://user:pass@host/db?sslmode=require
2. Test directly: `psql $DATABASE_URL -c "SELECT 1"`

---

## Next Steps

1. ✅ Set NEXTAUTH_SECRET in Vercel
2. ✅ Redeploy API project
3. ✅ Run health check: `curl https://api-ainamanipro.vercel.app/api/health`
4. ✅ Verify database shows "connected"
5. ✅ Test authenticated endpoints with JWT token

---

## Verification Results

After completing setup, come back and run tests to confirm:
- [ ] Health endpoint returns 200 with db: "connected"
- [ ] API routes are accessible
- [ ] Database queries succeed
- [ ] No timeout errors in Vercel logs

Status: 🔄 PENDING SETUP
Expected Time: 5-10 minutes
