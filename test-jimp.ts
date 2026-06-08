import { Jimp } from 'jimp';

async function testJimp() {
  try {
    console.log('Testing 192 from live site...');
    const img192 = await Jimp.read('https://only-memes.onrender.com/icons/icon-192x192.png');
    console.log('Width:', img192.bitmap.width);

    console.log('Testing 512 from live site...');
    const img512 = await Jimp.read('https://only-memes.onrender.com/icons/icon-512x512.png');
    console.log('Width:', img512.bitmap.width);
  } catch (err) {
    console.error('Jimp error:', err);
  }
}
testJimp();
