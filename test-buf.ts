import https from 'https';

async function testFetchH() {
  const buf = await fetch('https://only-memes.onrender.com/icons/icon-192x192.png').then(r => r.arrayBuffer());
  const b = Buffer.from(buf);
  console.log('Got buffer size', b.length);
  console.log('Hex', b.subarray(0, 50).toString('hex'));
  console.log('String', b.subarray(0, 50).toString());
}
testFetchH();
