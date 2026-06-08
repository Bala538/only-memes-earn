async function checkManifest() {
  try {
    let res = await fetch('https://only-memes.onrender.com/manifest.webmanifest');
    console.log(res.status, res.headers.get('content-type'));
    let text = await res.text();
    console.log(text);
  } catch(e) {
    console.log(e);
  }
}
checkManifest();
