/**
 * Vercel Setup Script
 * Run this to connect your database and deploy everything
 * 
 * Usage: node setup-vercel.js
 */

const { execSync } = require('child_process');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(prompt) {
  return new Promise(resolve => rl.question(prompt, resolve));
}

async function setup() {
  console.log('\n🚀 Edu Platform Vercel Setup\n');
  console.log('This script will:');
  console.log('1. Create a Vercel Postgres database');
  console.log('2. Link it to your project');
  console.log('3. Set environment variables');
  console.log('4. Deploy everything\n');

  const confirm = await question('Continue? (y/n): ');
  if (confirm.toLowerCase() !== 'y') {
    console.log('Setup cancelled.');
    process.exit(0);
  }

  try {
    console.log('\n📦 Creating Postgres database...');
    execSync('vercel postgres create edu-platform-db --yes', { stdio: 'inherit' });
    
    console.log('\n🔗 Linking database to project...');
    execSync('vercel link', { stdio: 'inherit' });
    
    console.log('\n✅ Database created and linked!');
    console.log('\n📝 Next steps:');
    console.log('1. Go to Vercel Dashboard: https://vercel.com/dashboard');
    console.log('2. Go to your project Settings → Environment Variables');
    console.log('3. Add these variables:');
    console.log('   - DATABASE_URL (from Storage → Postgres)');
    console.log('   - NEXTAUTH_SECRET (generate with: openssl rand -base64 32)');
    console.log('   - NEXTAUTH_URL=https://your-project.vercel.app');
    console.log('\n4. Then run: vercel --prod');
    
  } catch (error) {
    console.error('\n❌ Error during setup:', error.message);
    console.log('\n📋 Manual setup instructions:');
    console.log('1. Go to https://vercel.com/dashboard');
    console.log('2. Click your project → Storage → Create Database');
    console.log('3. Add DATABASE_URL to Environment Variables');
  }

  rl.close();
}

setup();

