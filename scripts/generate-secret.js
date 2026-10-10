const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const envPath = path.resolve(__dirname, '../.env');
const newSecret = crypto.randomBytes(32).toString('base64');

let content = fs.existsSync(envPath) ? fs.readFileSync(envPath, 'utf8') : '';

if (/^JWT_SECRET=.*$/m.test(content)) {
  content = content.replace(/^JWT_SECRET=.*$/m, `JWT_SECRET=${newSecret}`);
} else {
  content = (content ? content.trimEnd() + '\n' : '') + `JWT_SECRET=${newSecret}\n`;
}

fs.writeFileSync(envPath, content, 'utf8');
console.log(`[OK] Generated and updated JWT_SECRET in .env: ${newSecret}`);
