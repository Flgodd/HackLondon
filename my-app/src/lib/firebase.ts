import { initializeApp, cert, getApps, getApp } from 'firebase-admin/app';
import { getStorage } from 'firebase-admin/storage';
import dotenv from "dotenv"; dotenv.config();

const serviceAccount = process.env.MY_CREDENTIALS;
console.log("ugh ", serviceAccount);



const adminApp = !getApps().length ? initializeApp({
    credential: cert(JSON.parse(serviceAccount!)),
    storageBucket: 'wrangler-5a833.appspot.com',
  }, 'wrangler-5a833') : getApp();


export const storage = getStorage(adminApp);

// 'bucket' is an object defined in the @google-cloud/storage library.
// See https://googlecloudplatform.github.io/google-cloud-node/#/docs/storage/latest/storage/bucket
// for more details.