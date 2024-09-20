import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { ActivityIndicator, View } from 'react-native';
import { AuthProvider, useAuth } from './AuthContext';
import LoginScreen from './components/LoginScreen';
import ProfileScreen from './components/ProfileScreen';
import SessionScreen from './components/SessionScreen';
import StartScreen from './components/StartScreen';
import RegisterScreen from './components/RegisterScreen';
import ChatScreen from './components/ChatScreen';
import HomeScreen from './components/HomeScreen';
import VerificationScreen from './components/VerificationScreen';
import AddPartnerScreen from './components/AddPartnerScreen';

const Stack = createStackNavigator();

function Navigation() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!user ? (
          <>
            <Stack.Screen name="Start" component={StartScreen} />
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Register" component={RegisterScreen} />
          </>
        ) : (
          <>
            {!user.emailVerified ? (
              <Stack.Screen name="Verification" component={VerificationScreen} />
            ) : (
              <Stack.Screen name="Home" component={HomeScreen} />
            )}
            <Stack.Screen name="Profile" component={ProfileScreen} />
            <Stack.Screen name="Session" component={SessionScreen} />
            <Stack.Screen name="Chat" component={ChatScreen} />
            <Stack.Screen name="AddPartner" component={AddPartnerScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <Navigation />
    </AuthProvider>
  );
}