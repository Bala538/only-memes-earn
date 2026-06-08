import { Jimp } from 'jimp';

async function main() {
  const image192 = new Jimp({width: 192, height: 192, color: 0xFFC107FF});
  await image192.write('./public/icons/icon-192x192.png');
  
  const image512 = new Jimp({width: 512, height: 512, color: 0xFFC107FF});
  await image512.write('./public/icons/icon-512x512.png');
  console.log("Images created!");
}

main().catch(console.error);
