import React, { useState, useRef } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Text,
  Keyboard,
  TouchableWithoutFeedback,
  ActivityIndicator,
  StatusBar,
  Alert,
} from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import * as Animatable from 'react-native-animatable';
import { LinearGradient } from 'expo-linear-gradient';
import { createUserWithEmailAndPassword, sendEmailVerification } from 'firebase/auth';
import { auth } from '../firebase';

type RegisterScreenProps = {
  navigation: StackNavigationProp<any>;
};

const RegisterScreen: React.FC<RegisterScreenProps> = ({ navigation }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [sex, setSex] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  
  const nameRef = useRef<TextInput>(null);
  const emailRef = useRef<TextInput>(null);
  const phoneRef = useRef<TextInput>(null);
  const passwordRef = useRef<TextInput>(null);

  const handleRegister = async () => {
    if (!name || !email || !sex || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }
  
    setIsLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      await sendEmailVerification(user);

      // Navigate to email verification screen with correct parameters
      navigation.navigate('Verification', { 
        email: email,
        userData: { name, email, sex, uid: user.uid }
      });
    } catch (error) {
      console.error('Registration error:', error);
      Alert.alert('Registration Error', getErrorMessage(error));
    } finally {
      setIsLoading(false);
    }
  };


  const getErrorMessage = (error: any): string => {
    switch (error.code) {
      case 'auth/email-already-in-use':
        return 'This email is already registered. Please use a different email or try logging in.';
      case 'auth/invalid-email':
        return 'The email address is not valid. Please enter a valid email.';
      case 'auth/weak-password':
        return 'The password is too weak. Please use a stronger password.';
      default:
        return 'An unexpected error occurred. Please try again later.';
    }
  };

  const togglePasswordVisibility = () => {
    setIsPasswordVisible(!isPasswordVisible);
  };


  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <LinearGradient
        colors={['#000000', '#000000']}
        style={styles.container}
      >
        <StatusBar barStyle="light-content" />
        <Animatable.View 
          animation="fadeIn" 
          duration={1000} 
          style={styles.content}
        >
          <Animatable.Text 
            animation="fadeInDown" 
            duration={1000} 
            style={styles.title}
          >
            Create Account
          </Animatable.Text>

          <Animatable.View 
            animation="fadeInUp" 
            duration={1000} 
            delay={300} 
            style={styles.formContainer}
          >
            <View style={styles.inputContainer}>
              <Ionicons name="person-outline" size={24} color="#888" style={styles.inputIcon} />
              <TextInput
                ref={nameRef}
                style={styles.input}
                placeholder="Full Name"
                placeholderTextColor="#888"
                value={name}
                onChangeText={setName}
                returnKeyType="next"
                onSubmitEditing={() => emailRef.current?.focus()}
              />
            </View>

            <View style={styles.inputContainer}>
              <Ionicons name="mail-outline" size={24} color="#888" style={styles.inputIcon} />
              <TextInput
                ref={emailRef}
                style={styles.input}
                placeholder="Email"
                placeholderTextColor="#888"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                returnKeyType="next"
                onSubmitEditing={() => phoneRef.current?.focus()}
              />
            </View>

            <View style={styles.inputContainer}>
              <Ionicons name="call-outline" size={24} color="#888" style={styles.inputIcon} />
              <TextInput
                ref={phoneRef}
                style={styles.input}
                placeholder="Phone Number"
                placeholderTextColor="#888"
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
                returnKeyType="next"
                onSubmitEditing={() => passwordRef.current?.focus()}
              />
            </View>
            <View style={styles.inputContainer}>
              <Ionicons name="lock-closed-outline" size={24} color="#888" style={styles.inputIcon} />
              <TextInput
                ref={passwordRef}
                style={styles.input}
                placeholder="Password"
                placeholderTextColor="#888"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!isPasswordVisible}
                returnKeyType="done"
                onSubmitEditing={handleRegister}
              />
              <TouchableOpacity onPress={togglePasswordVisibility} style={styles.visibilityIcon}>
                <Ionicons 
                  name={isPasswordVisible ? "eye-off-outline" : "eye-outline"} 
                  size={24} 
                  color="#888" 
                />
              </TouchableOpacity>
            </View>
            <View style={styles.sexContainer}>
              <Ionicons name="male-female-outline" size={24} color="#888" style={styles.inputIcon} />
              <View style={styles.sexButtonsContainer}>
                <TouchableOpacity
                  style={[styles.sexButton, sex === 'Male' && styles.sexButtonSelected]}
                  onPress={() => setSex('Male')}
                >
                  <Text style={[styles.sexButtonText, sex === 'Male' && styles.sexButtonTextSelected]}>Male</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.sexButton, sex === 'Female' && styles.sexButtonSelected]}
                  onPress={() => setSex('Female')}
                >
                  <Text style={[styles.sexButtonText, sex === 'Female' && styles.sexButtonTextSelected]}>Female</Text>
                </TouchableOpacity>
              </View>
            </View>            
            <TouchableOpacity 
              style={styles.registerButton} 
              onPress={handleRegister}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.registerButtonText}>Sign Up</Text>
              )}
            </TouchableOpacity>
          </Animatable.View>

          <Animatable.View 
            animation="fadeInUp" 
            duration={1000} 
            delay={600} 
            style={styles.footer}
          >
            <Text style={styles.footerText}>Already have an account?</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
              <Text style={styles.loginLink}>Sign In</Text>
            </TouchableOpacity>
          </Animatable.View>
        </Animatable.View>
      </LinearGradient>
    </TouchableWithoutFeedback>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'flex-start', // Changed from 'center' to 'flex-start'
    alignItems: 'center',
  },
  content: {
    width: '100%',
    paddingHorizontal: 30,
    paddingTop: 50, // Added paddingTop to give some space at the top
  },
  title: {
    fontSize: 40,
    color: '#FFFFFF',
    marginBottom: 80, // Changed from -110 to 30
    fontWeight: 'bold',
    marginTop: 50, // Added marginTop to give some space at the top
    textAlign: 'left',
  },
  title2: {
    fontSize: 40,
    color: '#5e86f5',
    marginBottom: 10,
    fontWeight: 'bold',
    textAlign: 'left',
  },
  subtitle: {
    fontSize: 14,
    color: '#888',
    marginBottom: 30,
  },
  formContainer: {
    width: '100%',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#333',
    marginBottom: 20,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    height: 50,
    color: '#fff',
    fontSize: 16,
  },
  visibilityIcon: {
    padding: 10,
  },
  sexContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  sexButtonsContainer: {
    flexDirection: 'row',
    flex: 1,
  },
  sexButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderWidth: 1,
    borderColor: '#333',
    borderRadius: 5,
    marginHorizontal: 5,
  },
  sexButtonSelected: {
    backgroundColor: 'rgba(94, 134, 245, 0.1)', // Very light tint of #5e86f5
  },
  sexButtonText: {
    color: '#888',
    textAlign: 'center',
  },
  sexButtonTextSelected: {
    color: '#5e86f5',
  },
  registerButton: {
    backgroundColor: '#5e86f5',
    paddingVertical: 15,
    borderRadius: 25,
    alignItems: 'center',
    marginTop: 20,
  },
  registerButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 30,
  },
  footerText: {
    color: '#A0A0A0',
    fontSize: 14,
  },
  loginLink: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
    marginLeft: 5,
  },
});

export default RegisterScreen;