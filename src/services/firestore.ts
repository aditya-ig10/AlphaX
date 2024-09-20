import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
    apiKey: "AIzaSyCvhDXe7sUK2GJWj2OX5zBKmuMGMpVZIak",
    authDomain: "alphazero-7ce11.firebaseapp.com",
    projectId: "alphazero-7ce11",
    storageBucket: "alphazero-7ce11.appspot.com",
    messagingSenderId: "459794136623",
    appId: "1:459794136623:web:23b87dbdeb4af0137b10da",
    measurementId: "G-VJ6C4HMWV3"
  };

  const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(app);

// Initialize Cloud Firestore and get a reference to the service
export const db = getFirestore(app);

export default app;