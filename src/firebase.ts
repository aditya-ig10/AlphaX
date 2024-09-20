import { initializeApp } from 'firebase/app';
import { initializeAuth, getReactNativePersistence, GoogleAuthProvider } from 'firebase/auth';
import ReactNativeAsyncStorage from '@react-native-async-storage/async-storage';
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

// Initialize Auth with AsyncStorage persistence
const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(ReactNativeAsyncStorage)
});
const db = getFirestore(app);
const googleProvider = new GoogleAuthProvider();
const firestore = getFirestore(app);

export { auth, db, firestore };
export default app;