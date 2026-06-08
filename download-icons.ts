import https from 'https';
import fs from 'fs';

function downloadFile(url, dest) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);
    https.get(url, (response) => {
      response.pipe(file);
      file.on('finish', () => {
        file.close();
        resolve();
      });
    }).on('error', (err) => {
      fs.unlink(dest, () => {});
      reject(err);
    });
  });
}

async function main() {
  await downloadFile('https://via.placeholder.com/192.png', './public/icons/icon-192x192.png');
  await downloadFile('https://via.placeholder.com/512.png', './public/icons/icon-512x512.png');
  console.log('Images downloaded successfully!');
}

main().catch(console.error);
