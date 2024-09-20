import React, { useState } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Text,
  Alert,
} from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import * as Animatable from 'react-native-animatable';
import { LinearGradient } from 'expo-linear-gradient';
import { doc, updateDoc, getDoc, setDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { firestore } from '../firebase';
import { useAuth } from '../AuthContext';

type AddPartnerScreenProps = {
  navigation: StackNavigationProp<any>;
};

const AddPartnerScreen: React.FC<AddPartnerScreenProps> = ({ navigation }) => {
  const [partnerCode, setPartnerCode] = useState('');
  const { user, updateUserProfile } = useAuth();

  const handleAddPartner = async () => {
    if (!partnerCode) {
      Alert.alert('Error', 'Please enter the partner code');
      return;
    }
  
    try {
      if (user) {
        // Find the partner with the given code
        const usersRef = collection(firestore, 'users');
        const q = query(usersRef, where('partnerCode', '==', partnerCode));
        const querySnapshot = await getDocs(q);
  
        if (querySnapshot.empty) {
          Alert.alert('Error', 'Invalid partner code. Please try again.');
          return;
        }
  
        const partnerDoc = querySnapshot.docs[0];
        const partnerData = partnerDoc.data();
  
        console.log('Partner found:', partnerData);
  
        // Update current user's profile
        const userDocRef = doc(firestore, 'users', user.uid);
        const userData = (await getDoc(userDocRef)).data();
        
        console.log('Updating current user:', user.uid);
        await updateDoc(userDocRef, {
          partnerUid: partnerDoc.id,
          partnerName: partnerData.name,
          relationshipStatus: 'In a relationship',
          partnerCode: null // Remove the partner code once paired
        });
  
        console.log('Current user updated successfully');
  
        // Update partner's profile
        console.log('Updating partner:', partnerDoc.id);
        await updateDoc(doc(firestore, 'users', partnerDoc.id), {
          partnerUid: user.uid,
          partnerName: userData?.name || 'Partner',
          relationshipStatus: 'In a relationship',
          partnerCode: null // Remove the partner code once paired
        });
  
        console.log('Partner updated successfully');
  
        // Update local user profile
        updateUserProfile({ 
          relationshipStatus: 'In a relationship',
          partnerName: partnerData.name
        });
  
        Alert.alert('Success', 'Partner added successfully!');
        navigation.navigate('Home');
      }
    } catch (error) {
      console.error('Error adding partner:', error);
      if (error instanceof Error) {
        console.error('Error details:', error.message);
      }
      Alert.alert('Error', 'Failed to add partner. Please try again.');
    }
  };

  const handleStaySingle = async () => {
    Alert.alert(
      'Confirm',
      'Are you sure you want to stay single for now?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Yes', 
          onPress: async () => {
            try {
              if (user) {
                const userDocRef = doc(firestore, 'users', user.uid);
                
                // Generate a new partner code
                const newCode = generatePartnerCode();
                
                await setDoc(userDocRef, {
                  relationshipStatus: 'Single',
                  partnerCode: newCode
                }, { merge: true });
                
                // Update the local user profile
                updateUserProfile({ 
                  relationshipStatus: 'Single'
                });
                
                Alert.alert('Success', 'Your status has been updated to Single and a new partner code has been generated.');
                navigation.navigate('Home');
              }
            } catch (error) {
              console.error('Error updating status:', error);
              Alert.alert('Error', 'Failed to update status. Please try again.');
            }
          } 
        }
      ]
    );
  };

  const generatePartnerCode = () => {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 4; i++) {
      result += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return result;
  };

  return (
    <LinearGradient colors={['#000000', '#000000']} style={styles.container}>
      <Animatable.View animation="fadeIn" duration={1000} style={styles.content}>
        <Animatable.Text animation="fadeInDown" duration={1000} style={styles.title}>
          Add Your Partner
        </Animatable.Text>
        <Animatable.Text animation="fadeIn" duration={1000} style={styles.subtitle}>
          Enter the 4-digit alphanumeric code from your partner's device
        </Animatable.Text>
        <View style={styles.inputContainer}>
          <Ionicons name="heart-outline" size={24} color="#888" style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder="Enter partner code"
            placeholderTextColor="#888"
            value={partnerCode}
            onChangeText={setPartnerCode}
            maxLength={4}
            autoCapitalize="characters"
          />
        </View>
        <TouchableOpacity style={styles.addButton} onPress={handleAddPartner}>
          <Text style={styles.buttonText}>Add Partner</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.singleButton} onPress={handleStaySingle}>
          <Text style={styles.singleButtonText}>Stay Single for Now</Text>
        </TouchableOpacity>
      </Animatable.View>
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
    fontSize: 28,
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
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#333',
    marginBottom: 30,
    width: '100%',
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    height: 50,
    color: '#fff',
    fontSize: 18,
  },
  addButton: {
    backgroundColor: '#5e86f5',
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 25,
    marginBottom: 20,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  singleButton: {
    borderColor: '#5e86f5',
    borderWidth: 1,
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 25,
  },
  singleButtonText: {
    color: '#5e86f5',
    fontSize: 16,
  },
});

export default AddPartnerScreen;