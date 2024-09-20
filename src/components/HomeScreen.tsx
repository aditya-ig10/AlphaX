import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, ActivityIndicator } from 'react-native';
import { useAuth } from '../AuthContext';
import { StackNavigationProp } from '@react-navigation/stack';
import { doc, getDoc, updateDoc, query, collection, where, getDocs } from 'firebase/firestore';
import { firestore } from '../firebase';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import * as Animatable from 'react-native-animatable';

type HomeProps = {
  navigation: StackNavigationProp<any, 'Home'>;
};

const HomeScreen: React.FC<HomeProps> = ({ navigation }) => {
  const { user, logout } = useAuth();
  const [userName, setUserName] = useState('');
  const [partnerName, setPartnerName] = useState('');
  const [relationshipStatus, setRelationshipStatus] = useState('');
  const [partnerCode, setPartnerCode] = useState('');
  const [userSex, setUserSex] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchUserData = async () => {
      if (user) {
        try {
          const userDocRef = doc(firestore, 'users', user.uid);
          const userDoc = await getDoc(userDocRef);
          
          if (userDoc.exists()) {
            const userData = userDoc.data();
            setUserName(userData.name || 'User');
            setUserSex(userData.sex || '');

            // Check if the user has a partner
            if (userData.partnerUid) {
              setRelationshipStatus('In a relationship');
              setPartnerName(userData.partnerName || '');
            } else {
              // Check if the user is listed as someone's partner
              const partnersQuery = query(
                collection(firestore, 'users'),
                where('partnerUid', '==', user.uid)
              );
              const partnersSnapshot = await getDocs(partnersQuery);

              if (!partnersSnapshot.empty) {
                const partnerData = partnersSnapshot.docs[0].data();
                setRelationshipStatus('In a relationship');
                setPartnerName(partnerData.name || '');

                // Update the user's document to reflect the relationship
                await updateDoc(userDocRef, {
                  relationshipStatus: 'In a relationship',
                  partnerUid: partnersSnapshot.docs[0].id,
                  partnerName: partnerData.name,
                  partnerCode: null
                });
              } else {
                setRelationshipStatus('Single');
                if (!userData.partnerCode) {
                  const newCode = generatePartnerCode();
                  await updateDoc(userDocRef, { partnerCode: newCode });
                  setPartnerCode(newCode);
                } else {
                  setPartnerCode(userData.partnerCode);
                }
              }
            }
          }
        } catch (error) {
          console.error('Error fetching user data:', error);
        } finally {
          setIsLoading(false);
        }
      }
    };

    fetchUserData();
  }, [user]);

  const generatePartnerCode = () => {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 4; i++) {
      result += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return result;
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigation.navigate('Login');
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  const handleAddPartner = () => {
    navigation.navigate('AddPartner', { partnerCode });
  };

  if (isLoading) {
    return (
      <LinearGradient colors={['#000000', '#000000']} style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#00a3ff" />
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={['#000000', '#000000']} style={styles.container}>
      <StatusBar style="light" />
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
            <Ionicons name="log-out-outline" size={24} color="#fff" />
          </TouchableOpacity>
        </View>
        <Animatable.View animation="fadeIn" duration={1000} style={styles.contentContainer}>
          <Text style={styles.title}>{userName}</Text>
          {relationshipStatus === 'In a relationship' ? (
            <Animatable.View animation="fadeIn">
              <Text style={styles.relationshipStatus}>In a relationship with</Text>
              <Text style={styles.partnerInfo}>
                {userSex === 'Male' ? 'Girlfriend' : 'Boyfriend'}: {partnerName}
              </Text>
            </Animatable.View>
          ) : (
            <Animatable.View animation="fadeIn">
              <Text style={styles.singleStatus}>Status: Single</Text>
              <Text style={styles.partnerCode}>Your Partner Code: {partnerCode}</Text>
              <TouchableOpacity style={styles.addPartnerButton} onPress={handleAddPartner}>
                <Text style={styles.addPartnerButtonText}>Add Partner</Text>
              </TouchableOpacity>
            </Animatable.View>
          )}
        </Animatable.View>
      </SafeAreaView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  logoutButton: {
    marginTop: 25,
    padding: 10,
  },
  contentContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 40,
    color: '#FFFFFF',
    fontWeight: 'bold',
    marginBottom: 20,
  },
  relationshipStatus: {
    fontSize: 24,
    color: '#888',
    marginBottom: 10,
  },

  partnerInfo: {
    fontSize: 24,
    color: '#5e86f5',
    marginBottom: 20,
  },
  singleStatus: {
    fontSize: 24,
    color: '#888',
    marginBottom: 20,
  },
  partnerCode: {
    fontSize: 18,
    color: '#5e86f5',
    marginBottom: 20,
  },
  addPartnerButton: {
    backgroundColor: '#5e86f5',
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 25,
  },
  addPartnerButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default HomeScreen;