# Connecting Your Namecheap Custom Domain to Firebase Hosting

To point your custom domain **`onlymemesearn.store`** to your Firebase Hosting app, and completely hide `firebaseapp.com` from Google Sign-In, follow this step-by-step guide.

---

## Step 1: Add the Custom Domain in Firebase Hosting
1. Go to the [Firebase Console](https://console.firebase.google.com/).
2. Select your project: **`only-memes-earn`**.
3. In the left-hand navigation, click **Build** &rarr; **Hosting**.
4. Scroll down to the **Custom domains** section and click the **Add custom domain** button.
5. Enter your domain name: **`onlymemesearn.store`**
   - *Tip:* Keep the box checked for "Redirect www.onlymemesearn.store to onlymemesearn.store" to support both.
6. Click **Continue**.

---

## Step 2: Verify Domain Ownership (TXT Record)
To prove ownership of the domain:
1. Firebase will display a **TXT record** with a specific `Host` and `Value` (usually starting with `google-site-verification=...`). Copy this value.
2. Log in to your [Namecheap Dashboard](https://www.namecheap.com/).
3. Click on **Domain List** in the left sidebar.
4. Locate **`onlymemesearn.store`** and click the **Manage** button on the right.
5. Click on the **Advanced DNS** tab at the top.
6. In the **Host Records** table, click **Add New Record**:
   - **Type:** `TXT Record`
   - **Host:** `@`
   - **Value:** *(Paste the verification string you copied from Firebase)*
   - **TTL:** `Automatic` or `30 min`
7. Click the green checkmark icon to save.
8. Go back to your Firebase Console and click **Verify**. (Note: DNS propagation can take 5–10 minutes).

---

## Step 3: Point Domain to Firebase Hosting (A Records)
Once Firebase verifies your ownership, it will display two IP addresses for your **A Records** (for example, `199.36.158.100` and `199.36.158.95`).

1. Go back to your Namecheap **Advanced DNS** tab.
2. Look at the existing **Host Records** table. Delete any old default or redirection A Records (click the trash icon next to them).
3. Click **Add New Record** to add the first A Record:
   - **Type:** `A Record`
   - **Host:** `@`
   - **Value:** *(Enter the first IP address shown in your Firebase Console)*
   - **TTL:** `Automatic` or `30 min`
   - Click the green checkmark to save.
4. Click **Add New Record** to add the second A Record (for redundancy):
   - **Type:** `A Record`
   - **Host:** `@`
   - **Value:** *(Enter the second IP address shown in your Firebase Console)*
   - **TTL:** `Automatic` or `30 min`
   - Click the green checkmark to save.
5. *(Optional)* To map the `www` subdomain as well, click **Add New Record**:
   - **Type:** `CNAME Record`
   - **Host:** `www`
   - **Value:** `only-memes-earn.web.app.` *(Make sure to include the trailing dot)*
   - **TTL:** `Automatic` or `30 min`
   - Click the green checkmark to save.

---

## Step 4: Hide "firebaseapp.com" From Google Sign-In
By default, Google Authentication shows **"continue to only-memes-earn.firebaseapp.com"**. We have added a dynamic router in `firebaseConfig.ts` that detects when users are on `onlymemesearn.store` and automatically instructs Firebase Auth to run entirely under your custom domain instead!

To authorize this custom domain flow, you must perform two simple whitelists:

### 1. Add Redirect URI in Google Cloud Console
1. Open the [Google Cloud Console Credentials Page](https://console.cloud.google.com/apis/credentials).
2. Select your project **`only-memes-earn`** from the project selector at the top.
3. Scroll down to **OAuth 2.0 Client IDs** and click the pencil edit icon next to your main **Web client** credential (e.g., *"Web client (auto-created by Google Service)"*).
4. Scroll down to **Authorized redirect URIs** and click **Add URI**.
5. Enter:
   ```text
   https://onlymemesearn.store/__/auth/handler
   ```
6. *(Highly Recommended)* Click **Add URI** again and enter:
   ```text
   https://www.onlymemesearn.store/__/auth/handler
   ```
7. Click the blue **Save** button at the bottom of the page.

### 2. Add Authorized Domain in Firebase Auth
1. Go to the [Firebase Console](https://console.firebase.google.com/).
2. Click **Authentication** in the left-hand sidebar.
3. Click the **Settings** tab at the top.
4. Click **Authorized Domains** from the menu list.
5. Click **Add domain** and enter **`onlymemesearn.store`**.
6. *(Optional)* Add **`www.onlymemesearn.store`** as well.

---

## Step 5: Wait for Automatic SSL Provisioning
- Once you save your Namecheap DNS records, Firebase Hosting automatically requests and installs a **free global SSL (HTTPS) certificate** for your domain.
- This process can take anywhere from **1 to 24 hours** to activate worldwide. During this time, you might see an initial "Your connection is not secure" warning when visiting the custom domain. This is completely normal and will resolve itself automatically!

Your users will now have a fully customized, professional experience where they only see **`onlymemesearn.store`** when using Google Sign-In!
