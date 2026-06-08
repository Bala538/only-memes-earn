import fs from 'fs';
const b192 = fs.readFileSync('public/icons/icon-192x192.png');
console.log('192x192:', b192.toString('hex').slice(0, 16));
const b512 = fs.readFileSync('public/icons/icon-512x512.png');
console.log('512x512:', b512.toString('hex').slice(0, 16));
