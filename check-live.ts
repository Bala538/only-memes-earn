import https from 'https';

async function testFetch() {
  try {
    console.log('Fetching 192...');
    let res = await fetch('https://only-memes.onrender.com/icons/icon-192x192.png', { signal: AbortSignal.timeout(10000) });
    console.log('192 res:', res.status, res.headers.get('content-type'));
    
    console.log('Fetching 512...');
    let res2 = await fetch('https://only-memes.onrender.com/icons/icon-512x512.png', { signal: AbortSignal.timeout(10000) });
    console.log('512 res:', res2.status, res2.headers.get('content-type'));
    
  } catch(e) {
    console.error('Fetch error:', e);
  }
}
testFetch();
