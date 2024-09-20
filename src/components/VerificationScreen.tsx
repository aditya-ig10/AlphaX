import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { getAuth, onAuthStateChanged, sendEmailVerification, User } from 'firebase/auth';
import { LinearGradient } from 'expo-linear-gradient';
import { getFirestore, doc, setDoc } from 'firebase/firestore';
import { RouteProp } from '@react-navigation/native';

type VerificationScreenProps = {
  navigation: StackNavigationProp<any>;
  route: RouteProp<{ params: { email: string; userData: { name: string; email: string; sex: string; uid: string; } } }, 'params'>;
};

const VerificationScreen: React.FC<VerificationScreenProps> = ({ navigation, route }) => {
  const [isVerified, setIsVerified] = useState(false);
  const [timer, setTimer] = useState(60);
  const [email, setEmail] = useState('');
  const [userData, setUserData] = useState<any>(null);
  const auth = getAuth();
  const db = getFirestore();

  useEffect(() => {
    const initializeUserData = async () => {
      // Check if route.params exists and has the required data
      if (route.params?.email && route.params?.userData) {
        setEmail(route.params.email);
        setUserData(route.params.userData);
      } else {
        // If data is missing, try to get it from the current user
        const user = auth.currentUser;
        if (user) {
          setEmail(user.email || '');
          setUserData({ uid: user.uid });
        } else {
          // If no user is found, navigate back to the start screen
          Alert.alert('Error', 'Missing registration information. Please try again.');
          navigation.reset({
            index: 0,
            routes: [{ name: 'Start' }],
          });
        }
      }
    };

    initializeUserData();

    // Set up timer
    const interval = setInterval(() => {
      setTimer((prevTimer) => (prevTimer > 0 ? prevTimer - 1 : 0));
    }, 1000);

    // Clean up interval on component unmount
    return () => clearInterval(interval);
  }, [auth, navigation, route.params]);

  const handleVerificationSuccess = async (user: User) => {
    try {
      // Save user data to Firestore
      await setDoc(doc(db, 'users', user.uid), {
        name: userData?.name || '',
        email: user.email || '',
        sex: userData?.sex || '',
        emailVerified: true,
        createdAt: new Date().toISOString(),
      });
  
      // Navigate to the AddPartner screen
      navigation.replace('AddPartner');
    } catch (error) {
      console.error('Error saving user data to Firestore:', error);
      Alert.alert('Error', 'Failed to save user data. Please try again later.');
    }
  };

  const handleResendVerification = async () => {
    if (timer > 0) return;

    const user = auth.currentUser;
    if (user) {
      try {
        await sendEmailVerification(user);
        setTimer(60);
        Alert.alert('Verification Email Sent', 'Please check your inbox and follow the link to verify your email.');
      } catch (error) {
        console.error('Error resending verification email:', error);
        Alert.alert('Error', 'Failed to resend verification email. Please try again later.');
      }
    }
  };

  const handleCancel = async () => {
    try {
      // Delete the user account if it exists
      if (auth.currentUser) {
        await auth.currentUser.delete();
      }
      // Navigate back to the start screen
      navigation.replace('Start');
    } catch (error) {
      console.error('Error cancelling registration:', error);
      Alert.alert('Error', 'Failed to cancel registration. Please try again.');
    }
  };

  const checkVerificationStatus = async () => {
    const user = auth.currentUser;
    if (user) {
      try {
        await user.reload();
        if (user.emailVerified) {
          setIsVerified(true);
          await handleVerificationSuccess(user);
        } else {
          Alert.alert('Not Verified', 'Your email is not yet verified. Please check your inbox and follow the verification link.');
        }
      } catch (error) {
        console.error('Error checking verification status:', error);
        Alert.alert('Error', 'Failed to check verification status. Please try again.');
      }
    }
  };

  return (
    <LinearGradient colors={['#000000', '#000000']} style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Verify Your Email</Text>
        <Text style={styles.subtitle}>
          We've sent a verification email to {email}. Please check your inbox and follow the link to verify your email address. If this screen is still visible after verifying, restart the app.
        </Text>
        <TouchableOpacity
          style={[styles.button, timer > 0 && styles.disabledButton]}
          onPress={handleResendVerification}
          disabled={timer > 0}
        >
          <Text style={styles.buttonText}>
            {timer > 0 ? `Resend in ${timer}s` : 'Resend Verification Email'}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.button} onPress={checkVerificationStatus}>
          <Text style={styles.buttonText}>Check Verification Status</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.cancelButton} onPress={handleCancel}>
          <Text style={styles.cancelButtonText}>Cancel Registration</Text>
        </TouchableOpacity>
      </View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    width: '80%',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    color: '#FFFFFF',
    marginBottom: 20,
    fontWeight: 'bold',
  },
  subtitle: {
    fontSize: 16,
    color: '#888',
    marginBottom: 30,
    textAlign: 'center',
  },
  button: {
    backgroundColor: '#5e86f5',
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 5,
    marginBottom: 20,
  },
  disabledButton: {
    backgroundColor: '#888',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  cancelButton: {
    paddingVertical: 10,
  },
  cancelButtonText: {
    color: '#888',
    fontSize: 16,
  },
});

export default VerificationScreen;