import { createCanvas } from 'canvas';
import fs from 'fs';

function createScreenshot(width, height, filename) {
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext('2d');

  // Fill background
  ctx.fillStyle = '#FFC107'; // Amber color
  ctx.fillRect(0, 0, width, height);

  // Draw some basic shape
  ctx.fillStyle = '#FFFFFF';
  ctx.beginPath();
  ctx.arc(width / 2, height / 2, Math.min(width, height) / 4, 0, Math.PI * 2);
  ctx.fill();

  // Save to file
  const buffer = canvas.toBuffer('image/png');
  fs.writeFileSync(filename, buffer);
  console.log(`Created ${filename}`);
}

createScreenshot(1280, 720, './public/icons/screenshot-desktop.png');
createScreenshot(720, 1280, './public/icons/screenshot-mobile.png');
