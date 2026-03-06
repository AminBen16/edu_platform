const { exec } = require('child_process');
const vars = {
  'API_URL': 'https://edu-platform-omega.vercel.app/api',
  'NEXT_PUBLIC_API_URL': 'https://edu-platform-omega.vercel.app/api',
  'JWT_SECRET': 'efc6cc4a7c81733b6f0951e98235a55ff54f9df2f08b3ef369b66145233f1eb6'
};

let count = 0;
Object.entries(vars).forEach(([name, value]) => {
  const proc = exec(\echo \$'\n \n' | vercel env add \\);
  proc.stdin.write(value + '\n');
  proc.stdin.end();
  count++;
});

console.log('Submitted ' + count + ' environment variables');
