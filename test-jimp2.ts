import { Jimp } from 'jimp';

async function testJimp() {
  try {
    console.log('Testing 192 from LOCAL site...');
    const img192 = await Jimp.read('./public/icons/icon-192x192.png');
    console.log('Width:', img192.bitmap.width);

    console.log('Testing 512 from LOCAL site...');
    const img512 = await Jimp.read('./public/icons/icon-512x512.png');
    console.log('Width:', img512.bitmap.width);

    console.log('Testing wide from LOCAL site...');
    const wide = await Jimp.read('./public/icons/screenshot-desktop.png');
    console.log('Width:', wide.bitmap.width);

    console.log('Testing narrow from LOCAL site...');
    const narrow = await Jimp.read('./public/icons/screenshot-mobile.png');
    console.log('Width:', narrow.bitmap.width);
  } catch (err) {
    console.error('Jimp error:', err);
  }
}
testJimp();
