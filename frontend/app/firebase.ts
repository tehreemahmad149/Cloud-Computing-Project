import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyDRMzVXNsa8a77owpYHQauG5BHbdN8pVAI",
  authDomain: "cloudproject-f33b7.firebaseapp.com",
  projectId: "cloudproject-f33b7",
  storageBucket: "cloudproject-f33b7.firebasestorage.app",
  messagingSenderId: "488786922025",
  appId: "1:488786922025:web:9fbcca2dd39eed4d36aa38",
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
