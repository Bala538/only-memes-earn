import { createCanvas } from 'canvas';
import fs from 'fs';

function createIcon(size, filename) {
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');

  // Fill background
  ctx.fillStyle = '#FFC107'; // Amber color
  ctx.fillRect(0, 0, size, size);

  // Draw some basic shape
  ctx.fillStyle = '#FFFFFF';
  ctx.beginPath();
  ctx.arc(size / 2, size / 2, size / 4, 0, Math.PI * 2);
  ctx.fill();

  // Save to file
  const buffer = canvas.toBuffer('image/png');
  console.log(`Canvas generated buffer length: ${buffer.length}`);
  console.log(`Hex start: ${buffer.subarray(0, 10).toString('hex')}`);
  fs.writeFileSync(filename, buffer);
  
  const readBack = fs.readFileSync(filename);
  console.log(`Read back length: ${readBack.length}`);
  console.log(`Read back hex: ${readBack.subarray(0, 10).toString('hex')}`);
  console.log(`Created ${filename}`);
}

createIcon(192, './public/icons/icon-192x192.png');
createIcon(512, './public/icons/icon-512x512.png');
