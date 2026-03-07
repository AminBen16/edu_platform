# Vercel Free Deployment Guide - NO CREDIT CARD REQUIRED

This guide walks you through deploying the Education Platform to Vercel's free Hobby tier.

## Prerequisites (All Free)
- [ ] GitHub account (free)
- [ ] Vercel account (free - sign up with GitHub)
- [ ] Neon.tech account (free PostgreSQL - no credit card)

---

## Step 1: Set Up Neon PostgreSQL (Free Tier)

1. Go to https://console.neon.tech
2. Sign up with GitHub (no credit card required)
3. Click "Create Project"
4. Configure:
   - **Project name:** edu-platform
   - **Region:** Choose closest to you (e.g., eu-central-1 for Europe)
5. Click "Create Project"
6. Wait for provisioning to complete
7. Click "Connection Details" 
8. Select "Prisma" tab
9. Copy the connection string - it looks like:
   ```
   postgresql://username:password@ep-xxx.eu-central-1.aws.neon.tech/edu-platform?sslmode=require
   ```
10. **IMPORTANT:** Replace `password` with your actual password from the dashboard

---

## Step 2: Push Code to GitHub

If not already done:

```bash
cd c:\Users\user\Desktop\edu_platform
git add .
git commit -m "Ready for Vercel deployment"
git push origin main
```

---

## Step 3: Deploy to Vercel

### Option A: Vercel Dashboard (Recommended)

1. Go to https://vercel.com
2. Sign in with your GitHub account
3. Click "Add New..." → "Project"
4. Import your repository: `AminBen16/edu_platform`
5. In "Configure Project":
   - **Framework Preset:** Next.js (should auto-detect)
   - **Build Command:** `npm run build:all` or leave default
   - **Output Directory:** Leave default

### Step 4: Add Environment Variables

In Vercel project settings, add these environment variables:

| Variable | Value | Description |
|----------|-------|-------------|
| `DATABASE_URL` | Your Neon connection string | PostgreSQL connection |
| `NEXTAUTH_SECRET` | Generate at https://generate-secret.vercel.app/ | JWT signing key |
| `NEXTAUTH_URL` | Your Vercel URL (e.g., https://edu-platform.vercel.app) | Auth callback |
| `NEXT_PUBLIC_API_URL` | Same as NEXTAUTH_URL + /api/v1 | API base URL |
| `ALLOWED_ORIGINS` | Your Vercel URL | CORS |

### Step 5: Deploy

1. Click "Deploy"
2. Wait for build to complete (2-5 minutes)
3. Note your deployment URL

---

## Step 6: Run Database Migrations

After first deployment:

1. Install Vercel CLI: `npm i -g vercel`
2. Run: `vercel link`
3. Run migrations: 
   ```bash
   npx prisma migrate deploy --schema=./packages/db/schema.prisma
   ```

Or use Neon Console's SQL editor to run migrations manually.

---

## Step 7: Seed the Database

1. Run seed script:
   ```bash
   npx prisma db seed --schema=./packages/db/schema.prisma
   ```

This creates test users:
- **Admin:** admin@school.edu / admin123
- **Teacher:** teacher@school.edu / teacher123  
- **Student:** student@school.edu / student123

---

## Verification Checklist

After deployment, test these URLs:

| Test | URL | Expected |
|------|-----|----------|
| Admin App | https://your-app.vercel.app | Next.js homepage loads |
| API Health | https://your-app.vercel.app/ | JSON with "operational" |
| Login | https://your-app.vercel.app/auth/login | Login form |

---

## Architecture Summary

```
+-------------------------------------------------------------+
|                    Vercel (Free)                           |
|  +-----------------+    +--------------------------------+    |
|  |  Admin App      |    |  API (Express)                 |    |
|  |  Next.js 14     |    |  /api/v1/*                    |    |
|  |  Port 3000      |    |  Serverless Functions          |    |
|  +--------+--------+    +------------+-----------------+    |
|           |                          |                      |
|           +------------+-------------+                      |
|                        v                                  |
|           +------------------------+                       |
|           |   Neon PostgreSQL     |                       |
|           |   (Free Tier)         |                       |
|           +------------------------+                       |
+-------------------------------------------------------------+
```

---

## Cost Summary

| Service | Plan | Monthly Cost |
|---------|------|--------------|
| Vercel | Hobby | $0 |
| Neon PostgreSQL | Free | $0 |
| GitHub | Free | $0 |
| **TOTAL** | | **$0** |

---

## Troubleshooting

### Build Fails
- Check Environment Variables are set
- Ensure DATABASE_URL is correct

### Database Connection Error
- Verify DATABASE_URL format: `postgresql://...neon.tech/db?sslmode=require`
- Check Neon project is active (not suspended)

### API 404 Errors
- Verify NEXT_PUBLIC_API_URL is set correctly
- Check vercel.json routes configuration

---

## Next Steps After Deployment

1. Access admin panel
2. Create your first school
3. Invite teachers
4. Create lessons and quizzes
5. Test student flow

---

**Repository:** https://github.com/AminBen16/edu_platform  
**Deployed URL:** [Your Vercel URL]
</parameter>
</create_file>
