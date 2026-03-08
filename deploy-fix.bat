@echo off
cd /d c:\Users\user\Desktop\edu_platform
echo Staging files...
git add .vercelignore vercel.json apps\admin\next.config.js apps\admin\lib\api.ts package.json packages\auth\nextauth.ts packages\db\index.ts DEPLOYMENT_FIX.md
echo Committing changes...
git commit -m "fix: resolve Vercel deployment issues - enable API build, remove hardcoded URLs"
echo Pushing to GitHub...
git push origin main
echo Done!
pause

