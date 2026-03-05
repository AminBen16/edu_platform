# 🚀 Education Platform - Deployment Guide

This guide will help you deploy the Education Platform to Vercel with a free PostgreSQL database from Neon (no credit card required).

## Prerequisites

- Vercel account (free): https://vercel.com
- Neon account (free): https://console.neon.tech
- GitHub account (to connect with Vercel)
- Node.js 16+ installed

## Step 1: Set Up Neon PostgreSQL Database

Neon offers a free PostgreSQL database with 3 projects and 10GB storage per account. No credit card required.

### 1.1 Create Neon Account

1. Go to https://console.neon.tech
2. Sign up with your email or GitHub account
3. Create a new project named "eduplatform"
4. Choose a region closest to you (e.g., US-East-1)

### 1.2 Get Database Connection String

1. In Neon Console, open your project
2. Click on the "SQL" tab in the connection string section
3. You should see something like:
   ```
   postgresql://neondb_owner:password@ep-xxxxx.us-east-1.aws.neon.tech/neondb?sslmode=require
   ```
4. Copy this entire connection string

## Step 2: Set Up Local Development (Optional but Recommended)

### 2.1 Configure Local Environment

1. Copy the environment template:
   ```bash
   cp .env.local.example .env.local
   ```

2. Edit `.env.local` and replace with your actual values:
   ```bash
   DATABASE_URL="<your-neon-postgres-connection-string>"
   NEXTAUTH_SECRET="<generate-with: openssl rand -base64 32>"
   NEXTAUTH_URL="http://localhost:3000"
   NEXT_PUBLIC_API_URL="http://localhost:3001/api/v1"
   ```

### 2.2 Install Dependencies

```bash
# Install all dependencies
npm install

# Install Prisma for database management
npm install -g prisma
```

### 2.3 Run Database Migrations

```bash
# Generate Prisma client
npx prisma generate

# Run migrations (creates tables)
npx prisma migrate deploy

# Optional: Seed with sample data
npx prisma db seed
```

### 2.4 Start Development Servers

```bash
# Terminal 1: Start API server
cd apps/api
npm run dev

# Terminal 2: Start Next.js admin app
cd apps/admin
npm run dev
```

Access:
- Admin Dashboard: http://localhost:3000
- API: http://localhost:3001

## Step 3: Deploy to Vercel

### 3.1 Push Code to GitHub

1. Initialize git (if not already done):
   ```bash
   git init
   git add .
   git commit -m "Initial commit: education platform"
   ```

2. Create a GitHub repository and push:
   ```bash
   git remote add origin https://github.com/YOUR_USERNAME/edu_platform.git
   git branch -M main
   git push -u origin main
   ```

### 3.2 Connect to Vercel

1. Go to https://vercel.com/new
2. Import your GitHub repository
3. Select "Next.js" as the framework (Vercel will detect it)
4. Click "Deploy"

### 3.3 Add Environment Variables in Vercel

After initial deploy, configure environment variables:

1. Go to your Vercel project dashboard
2. Navigate to "Settings" → "Environment Variables"
3. Add these variables:

| Variable Name | Value | Notes |
|---|---|---|
| `DATABASE_URL` | Your Neon connection string | From Step 1.2 |
| `NEXTAUTH_SECRET` | `openssl rand -base64 32` | Generate a new one |
| `NEXTAUTH_URL` | `https://your-vercel-domain.vercel.app` | Your Vercel URL |
| `NODE_ENV` | `production` | |
| `NEXT_PUBLIC_API_URL` | `https://your-vercel-domain.vercel.app/api/v1` | Your API endpoint |

4. Click "Save"

### 3.4 Deploy!

1. Go back to the Deployments tab
2. Redeploy to apply environment variables:
   ```bash
   vercel --prod
   ```

## Step 4: Run Database Migrations on Production

After deploying to Vercel, you need to create the database schema:

### Option A: Using Prisma Migrate (Recommended)

```bash
# Set your production database URL
export DATABASE_URL="your-neon-postgres-url"

# Run migrations
npx prisma migrate deploy
```

### Option B: Using Vercel CLI

```bash
# Login to Vercel
vercel login

# Set environment and run migrations
vercel env pull
npx prisma migrate deploy
```

## Step 5: Verify Deployment

1. Visit your Vercel app: https://your-domain.vercel.app
2. You should see the login page
3. Try logging in (default credentials depend on seed data)
4. Check the API health: https://your-domain.vercel.app/api/v1

## Troubleshooting

### Common Issues

#### "Database connection error"
- Check DATABASE_URL is set in Vercel environment variables
- Verify Neon connection string is correct
- Ensure your IP is whitelisted in Neon (usually automatic)

#### "POST /api/v1/auth/login not found"
- Verify vercel.json routes are correct
- Rebuild API TypeScript: `cd apps/api && npm run build`

#### "NEXT_PUBLIC_API_URL is incorrect"
- Update environment variable in Vercel
- Redeploy after changing environment variables

#### "Prisma Client not generated"
- Run: `npx prisma generate`
- Rebuild and redeploy

### Check Logs

```bash
# View Vercel deployment logs
vercel logs <your-project-url>

# Local development logs
npm run dev  # Both API and admin in watch mode
```

## Scaling Notes

Neon free tier includes:
- 5GB storage per project
- 3 projects total
- Always available (no auto-suspend)

For production scaling to higher traffic:
1. Upgrade Neon plan to Pro ($15/month) or higher
2. Enable connection pooling in Neon settings
3. Add Vercel Pro features as needed

## Database Management

### Connect to Database with CLI

```bash
# Using Neon web console or psql client
psql "your-postgres-connection-string"
```

### View/Update Data

```bash
# Using Prisma Studio (visual database browser)
npx prisma studio
```

### Create Backups

Neon provides automated backups. To manually backup:

```bash
# Export data
pg_dump "your-postgres-connection-string" > backup.sql

# Restore data
psql "your-postgres-connection-string" < backup.sql
```

## Next Steps

1. ✅ Deploy to Vercel
2. ✅ Setup PostgreSQL database
3. Configure custom domain (optional)
4. Enable user authentication
5. Add file storage (Supabase, S3, etc.)
6. Set up email notifications (SendGrid, Gmail, etc.)
7. Configure error tracking (Sentry)
8. Set up monitoring and alerts

## Getting Help

- Vercel Docs: https://vercel.com/docs
- Neon Docs: https://neon.tech/docs
- Prisma Docs: https://www.prisma.io/docs
- Next.js Docs: https://nextjs.org/docs

## Important Security Notes

- Never commit `.env.local` or `.env` files
- Always use strong, randomly generated secrets
- Keep dependencies updated
- Monitor database access logs
- Implement rate limiting on API routes
- Use HTTPS only (Vercel does this by default)

---

**Last Updated**: March 5, 2026
**Version**: 1.0
