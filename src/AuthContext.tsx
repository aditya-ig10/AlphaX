import React, { createContext, useState, useEffect, useContext } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { 
  onAuthStateChanged, 
  User, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  sendPasswordResetEmail
} from 'firebase/auth';
import { 
  auth, 
  db 
} from './firebase';
import { 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  disableNetwork, 
  enableNetwork,
  collection,
  query,
  where,
  getDocs
} from 'firebase/firestore';

type UserProfile = {
  name: string;
  email: string;
  phone: string;
  relationshipStatus?: 'Single' | 'In a relationship';
  partnerUid?: string;
  partnerName?: string;
  partnerCode?: string;
};

type AuthContextType = {
  user: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
  signUp: (email: string, password: string, name: string, phone: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updateUserProfile: (profile: Partial<UserProfile>) => Promise<void>;
  addPartner: (partnerCode: string) => Promise<void>;
  generatePartnerCode: () => Promise<string>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);
        await AsyncStorage.setItem('user', JSON.stringify(firebaseUser));
        
        // Fetch user profile from Firestore
        const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
        if (userDoc.exists()) {
          const profileData = userDoc.data() as UserProfile;
          setUserProfile(profileData);
          await AsyncStorage.setItem('userProfile', JSON.stringify(profileData));
        }
      } else {
        setUser(null);
        setUserProfile(null);
        await AsyncStorage.removeItem('user');
        await AsyncStorage.removeItem('userProfile');
      }
      setLoading(false);
    });

    // Check for stored user data on initial load
    const bootstrapAsync = async () => {
      try {
        const [userJson, profileJson] = await Promise.all([
          AsyncStorage.getItem('user'),
          AsyncStorage.getItem('userProfile')
        ]);
        
        if (userJson) {
          setUser(JSON.parse(userJson));
        }
        if (profileJson) {
          setUserProfile(JSON.parse(profileJson));
        }
      } catch (e) {
        console.error('Failed to restore user data', e);
      } finally {
        setLoading(false);
      }
    };

    bootstrapAsync();

    return () => unsubscribe();
  }, []);

  const signUp = async (email: string, password: string, name: string, phone: string) => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const newUser = userCredential.user;
      
      // Create user profile in Firestore
      const userProfile: UserProfile = {
        name,
        email,
        phone,
        relationshipStatus: 'Single'
      };
      await setDoc(doc(db, 'users', newUser.uid), userProfile);
      
      setUser(newUser);
      setUserProfile(userProfile);
      await AsyncStorage.setItem('user', JSON.stringify(newUser));
      await AsyncStorage.setItem('userProfile', JSON.stringify(userProfile));
    } catch (error) {
      console.error('Error signing up:', error);
      throw error;
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const loggedInUser = userCredential.user;
      
      // Fetch user profile from Firestore
      const userDoc = await getDoc(doc(db, 'users', loggedInUser.uid));
      if (userDoc.exists()) {
        const profileData = userDoc.data() as UserProfile;
        setUserProfile(profileData);
        await AsyncStorage.setItem('userProfile', JSON.stringify(profileData));
      }
      
      setUser(loggedInUser);
      await AsyncStorage.setItem('user', JSON.stringify(loggedInUser));
    } catch (error) {
      console.error('Error signing in:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await disableNetwork(db);
      await auth.signOut();
      setUser(null);
      setUserProfile(null);
      await AsyncStorage.removeItem('user');
      await AsyncStorage.removeItem('userProfile');
      await enableNetwork(db);
    } catch (error) {
      console.error('Error logging out:', error);
      await enableNetwork(db).catch(console.error);
      throw error;
    }
  };

  const resetPassword = async (email: string) => {
    try {
      await sendPasswordResetEmail(auth, email);
    } catch (error) {
      console.error('Error resetting password:', error);
      throw error;
    }
  };

  const updateUserProfile = async (profile: Partial<UserProfile>) => {
    if (user) {
      try {
        const userDocRef = doc(db, 'users', user.uid);
        await updateDoc(userDocRef, profile);
        setUserProfile(prevProfile => ({ ...prevProfile, ...profile } as UserProfile));
        await AsyncStorage.setItem('userProfile', JSON.stringify({ ...userProfile, ...profile }));
      } catch (error) {
        console.error('Error updating user profile:', error);
        throw error;
      }
    }
  };

  const addPartner = async (partnerCode: string) => {
    if (!user) throw new Error('User not authenticated');

    try {
      // Find partner with the given code
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('partnerCode', '==', partnerCode));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        throw new Error('Invalid partner code');
      }

      const partnerDoc = querySnapshot.docs[0];
      const partnerData = partnerDoc.data() as UserProfile;

      // Update current user's profile
      await updateUserProfile({
        partnerUid: partnerDoc.id,
        partnerName: partnerData.name,
        relationshipStatus: 'In a relationship',
        partnerCode: null
      });

      // Update partner's profile
      const partnerDocRef = doc(db, 'users', partnerDoc.id);
      await updateDoc(partnerDocRef, {
        partnerUid: user.uid,
        partnerName: userProfile?.name,
        relationshipStatus: 'In a relationship',
        partnerCode: null
      });
    } catch (error) {
      console.error('Error adding partner:', error);
      throw error;
    }
  };

  const generatePartnerCode = async () => {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 4; i++) {
      result += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    
    if (user) {
      await updateUserProfile({ partnerCode: result });
    }
    
    return result;
  };

  return (
    <AuthContext.Provider 
      value={{ 
        user, 
        userProfile, 
        loading, 
        signUp, 
        signIn, 
        logout, 
        resetPassword, 
        updateUserProfile, 
        addPartner,
        generatePartnerCode
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};