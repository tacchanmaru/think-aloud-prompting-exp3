// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDHu0TKCTcXjjpWx_nA0Od4AH5XE0zKnNw",
  authDomain: "think-aloud-prompting-exp3.firebaseapp.com",
  projectId: "think-aloud-prompting-exp3",
  storageBucket: "think-aloud-prompting-exp3.firebasestorage.app",
  messagingSenderId: "94156405389",
  appId: "1:94156405389:web:cc3313f68306bf1d4d00c4",
  measurementId: "G-15HGC3B3HB"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
