import fs from 'fs';
console.log('192 size:', fs.statSync('./public/icons/icon-192x192.png').size);
console.log('512 size:', fs.statSync('./public/icons/icon-512x512.png').size);
console.log('192 start:', fs.readFileSync('./public/icons/icon-192x192.png').subarray(0, 10).toString('hex'));
console.log('512 start:', fs.readFileSync('./public/icons/icon-512x512.png').subarray(0, 10).toString('hex'));
