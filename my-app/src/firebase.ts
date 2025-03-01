import * as admin from "firebase-admin";
import dotenv from "dotenv";

dotenv.config();

// Parse the JSON key from the environment variable
const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT as string);

// Initialize Firebase Admin SDK
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount as admin.ServiceAccount),
});

// Get Firestore instance
const db = admin.firestore();
console.log("✅ Firebase connected successfully!");

export default db;