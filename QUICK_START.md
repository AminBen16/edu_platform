# 🚀 Quick Start Guide - 5 Minutes to Deployment

This guide will get you from zero to deployed in minutes!

## What You'll Need (Free!)
1. **Neon PostgreSQL** - Free database (no credit card needed)
2. **Vercel** - Free hosting
3. **GitHub** - Free code repository
4. **Neon + Vercel** = Fully functional education platform at $0/month!

## Step 1: Create Free Database (2 minutes)

1. Go to https://console.neon.tech
2. Click **"Sign Up"** (use Google or GitHub - easier!)
3. Create a new project called "eduplatform"
4. Click **SQL** tab in the connection details
5. **Copy the full connection string** (it looks like: `postgresql://user:pass@...`)
6. **Save it somewhere safe** - you'll need it in Step 3

## Step 2: Prepare Your Computer (3 minutes)

### Windows Users
1. Download Node.js from https://nodejs.org/ (pick "LTS" version)
2. Install it (accept all defaults)
3. Open Command Prompt/PowerShell and type:
   ```
   node --version
   npm --version
   ```
   If you see version numbers, you're good!

### Mac/Linux Users
```bash
brew install node  # Mac with homebrew
# or download from https://nodejs.org/
```

## Step 3: Set Up the Project (5 minutes)

1. **Download and unzip** this project (or clone from GitHub)
2. Open terminal/command prompt in the project folder
3. **Copy the connection string** from Neon (Step 1)

### Windows
```
setup.bat
```
Then when asked, paste your Neon connection string in `.env.local`

### Mac/Linux
```bash
chmod +x setup.sh
./setup.sh
```

This will:
- Install all dependencies
- Set up your database
- Create sample data (teachers, students, etc.)

## Step 4: Test Locally (Optional but Recommended)

```bash
npm run dev
```

Then open in your browser:
- **Admin Dashboard**: http://localhost:3000
- **API**: http://localhost:3001

Try logging in with:
- Email: `admin@kavuma.com`
- Password: `password`

## Step 5: Deploy to Vercel (2 minutes)

### Option A: GitHub + Vercel Button (Easiest!)

1. Push your code to GitHub:
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin https://github.com/YOUR_USERNAME/eduplatform
   git push -u origin main
   ```

2. Go to https://vercel.com/new
3. Click **"Import Git Repository"**
4. Select your GitHub repo
5. Click **"Deploy"**
6. After it deploys, add environment variables:
   - Go to **Settings → Environment Variables**
   - Add:
     - `DATABASE_URL` = Your Neon connection string
     - `NEXTAUTH_SECRET` = Any random 32+ character string
     - `NEXTAUTH_URL` = `https://your-vercel-domain.vercel.app`
7. Click **Deployments → Redeploy** to apply changes

### Option B: Vercel CLI (For Advanced Users)

```bash
npm install -g vercel
vercel login
vercel --prod
```

## Step 6: Final Steps

1. Visit your Vercel app URL (Vercel will show it to you)
2. You should see the login page!
3. Migrate database (run once):
   ```bash
   npx prisma migrate deploy
   ```
4. **You're live!** 🎉

## Troubleshooting

### "Database connection error"
- Check DATABASE_URL is set in Vercel environment variables
- Make sure the connection string is from Neon (not another service)

### "Page won't load"
- Go to Vercel Deployments and check build logs
- Check that all environment variables are set

### "Login doesn't work"
- Run `npx prisma db seed` to create sample users
- Check your NEXTAUTH_SECRET is set in Vercel

### "Need help?"
- Read `DEPLOYMENT_GUIDE.md` for detailed instructions
- Check `README.md` for more info

## What's Included?

✅ **Multi-school support** - Different schools, isolated data  
✅ **User roles** - Teachers, students, admins  
✅ **Lessons** - Upload content, manage learning materials  
✅ **Quizzes** - Create assessments, auto-grade  
✅ **Assignments** - Give homework, track submissions  
✅ **Live classes** - Real-time video/audio classroom  
✅ **Chat** - Real-time messaging between users  
✅ **Attendance** - Track who's present  
✅ **Grading** - Full grade management system  

## Next Steps After Deployment

1. **Customize domain** - Set up your own domain instead of vercel.app
2. **Enable email** - Set up Gmail/SendGrid for notifications
3. **Add file storage** - Enable file uploads (Supabase, AWS S3)
4. **Invite users** - Create teacher and student accounts
5. **Setup content** - Start adding lessons and quizzes

## Tips for Success

💡 **Use the admin account first** to set everything up  
💡 **Create a test class** with sample lessons  
💡 **Invite a few teachers** to test the system  
💡 **Monitor your Neon usage** (free tier has 5GB storage)  
💡 **Backup your database regularly**  

## Need More Help?

- Full Deployment Guide: `DEPLOYMENT_GUIDE.md`
- Project README: `README.md`
- GitHub Issues: Report bugs and request features
- Email: [Create a support email]

---

**Congratulations!** You now have a fully-functional, multi-school education platform running for FREE! 🎓

**Estimated monthly cost**: $0 (free tier sufficient for small schools)
