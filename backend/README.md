# OnlyMemes Earn Standalone Node.js Backend

A polished, clean, and robust standalone Node.js-Express server backend configured to handle 6-digit OTP verification requests, email notifications using Nodemailer, and user authentication management via the Firebase Admin SDK.

## Features

- **Robust 6-digit OTP engine** to manage and issue validation sessions.
- **Transporter Configuration** to send emails through custom domain SMTP servers (Gmail, Namecheap, Outlook, etc.).
- **Firebase Auth Validation** to handle passwords updates and user availability checks securely.
- **Configured CORS mappings** to allow secure cross-origin requests from custom domains (like `onlymemesearn.store`).
- **Pristine MVC-style structure** for modularity and effortless scaling.

---

## 📁 Project Directory Structure

```text
/backend/
├── src/
│   ├── config/
│   │   ├── firebase.ts    # Firebase Admin SDK Setup and Credential Checks
│   │   └── mailer.ts      # SMTP Transporter Configuration and Fallbacks
│   ├── controllers/
│   │   └── authController.ts  # OTP Generation, Verification & Reset Logics
│   ├── routes/
│   │   └── authRoutes.ts  # Express Router mapping paths to Controllers
│   └── index.ts           # App Entry Point & middleware setups
├── .env.example           # Shared Environment Variables Layout
├── package.json           # Dependencies, devDependencies & Scripts
├── tsconfig.json          # TypeScript Target and Compiler Directives
└── README.md              # Setup & Deployment Instructions
```

---

## 🚀 Setting Up the Standalone Server

### Prerequisites
Make sure you have [Node.js (v18+)](https://nodejs.org/) and NPM installed.

### 1. Installation
Navigate into the `/backend` directory and install the required dependencies:
```bash
cd backend
npm install
```

### 2. Configure Environment Variables
Copy `.env.example` to a new `.env` file:
```bash
cp .env.example .env
```
Open `.env` and configure your credentials:
1. **`PORT`**: The local port the server runs on (e.g., `3000`).
2. **`ALLOWED_ORIGINS`**: Add your production custom domains and local webapp urls (comma-separated):
   `https://onlymemesearn.store,https://www.onlymemesearn.store`
3. **`SMTP Settings`**: Configure your custom address host, port, user and app-specific mailer passwords to start sending active OTP emails to registering users.
4. **`FIREBASE_SERVICE_ACCOUNT`**: Retrieve a Firebase Service Account key JSON file from your **Firebase Console -> Project Settings -> Service Accounts -> Generate new private key**. Minify the JSON code and insert it as a string on a single line.

---

## 🛠️ Launching the Application

### Running in Development Mode (Live reload)
To run the server in development mode with active file-watching:
```bash
npm run dev
```

### Building for Production
To compile the TypeScript code into highly optimized plain JavaScript inside `/dist`:
```bash
npm run build
```

### Running the Production Server
Start the production server using Node.js:
```bash
npm start
```

---

## 🌐 API Endpoint Schema REFERENCE

| Method | Route | Description | Body Schema |
| :--- | :--- | :--- | :--- |
| **POST** | `/api/auth/send-otp` | Generates & sends a 6-digit verification code to the target email. | `{ "email": "user@example.com", "mode": "signup" \| "forgot-password" }` |
| **POST** | `/api/auth/verify-otp` | Validates a submitted 6-digit confirmation code. | `{ "email": "user@example.com", "otp": "******" }` |
| **POST** | `/api/auth/reset-password` | Resets a client password inside Firebase Auth securely. | `{ "email": "user@example.com", "otp": "******", "newPassword": "new_password_here" }` |

---

## 🎯 Domain Integration (Deployment Advice)

Ensure your frontend `src/utils/api.ts` file is configured with the target endpoint URL of this server (e.g., if hosted on a separate sub-domain, write its full address there, or if served through a proxy, use target relative paths `/api`).

Have a great deploy!
