#!/usr/bin/env node

const crypto = require('crypto');

// Generate JWT secret
const jwtSecret = crypto.randomBytes(64).toString('hex');

// Generate database URL for SQLite (for now)
const databaseUrl = 'file:./dev.db';

console.log('=== Environment Variables for Production ===');
console.log('');
console.log('NEXTAUTH_SECRET:');
console.log(jwtSecret);
console.log('');
console.log('DATABASE_URL:');
console.log(databaseUrl);
console.log('');
console.log('NODE_ENV:');
console.log('production');
console.log('');
console.log('SENTRY_DSN:');
console.log('(Optional - Add your Sentry DSN here)');
console.log('');
console.log('=== Instructions ===');
console.log('1. Copy the NEXTAUTH_SECRET value above');
console.log('2. Run: vercel env rm NEXTAUTH_SECRET production');
console.log('3. Run: vercel env add NEXTAUTH_SECRET production');
console.log('4. Paste the secret when prompted');
console.log('');
console.log('Repeat for other variables as needed');
