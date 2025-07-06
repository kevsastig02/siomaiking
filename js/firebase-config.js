// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBEE4AbmL8XJMRaNEJjK9cNBNGh8vVp8pY",
  authDomain: "siomaikinginventory.firebaseapp.com",
  projectId: "siomaikinginventory",
  storageBucket: "siomaikinginventory.firebasestorage.app",
  messagingSenderId: "492350491818",
  appId: "1:492350491818:web:abdfe4732973251de654d3"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
const auth = firebase.auth();
const db = firebase.firestore();

// Enable offline persistence
db.enablePersistence()
  .catch((err) => {
      console.log("Firebase persistence error: ", err);
  });