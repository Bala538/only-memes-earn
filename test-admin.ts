import admin from 'firebase-admin';

async function test() {
  try {
    admin.initializeApp({ projectId: 'only-memes-earn' });
    console.log("Initialized");
    const user = await admin.auth().getUserByEmail('balakumar7654@gmail.com');
    console.log("User found:", user.uid);
  } catch (e: any) {
    console.error("Error:", e.message);
  }
}

test();
