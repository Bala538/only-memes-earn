import fs from 'fs';

for (const file of ['public/icons/icon-192x192.png', 'public/icons/icon-512x512.png']) {
  const content = fs.readFileSync(file, 'utf8').trim();
  let b64 = content;
  if (content.startsWith('data:image/png;base64,')) {
    b64 = content.split(',')[1];
  }
  const buffer = Buffer.from(b64, 'base64');
  fs.writeFileSync(file, buffer);
  console.log(`Fixed ${file}`);
}
