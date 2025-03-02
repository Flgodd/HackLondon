// Import the functions you need from the SDKs you need
import { getApp, getApps, initializeApp } from "firebase/app";
import { getStorage } from "firebase/storage";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAxBPel3_vPqL0rQpnTBJzt7Y8ncDnQpRw",
  authDomain: "wrangler-5a833.firebaseapp.com",
  databaseURL: "https://wrangler-5a833.firebaseio.com",
  projectId: "wrangler-5a833",
  storageBucket: "wrangler-5a833.appspot.com",
  messagingSenderId: "50365616318",
  appId: "1:50365616318:web:e6ccfd9a8cb3b8a341ceef"
};

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
export const storage = getStorage(app);