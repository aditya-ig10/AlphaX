import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ActivityIndicator,
  FlatList,
  Image,
  Modal,
  Alert,
  Dimensions,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { StackNavigationProp } from '@react-navigation/stack';
import { useAuth } from '../AuthContext';
import { firestore } from '../firebase';
import {
  doc,
  setDoc,
  onSnapshot,
  updateDoc,
  deleteDoc,
  Timestamp,
  collection,
  query,
  where,
  getDocs,
} from 'firebase/firestore';
import * as Animatable from 'react-native-animatable';

type SessionProps = {
  navigation: StackNavigationProp<any, 'Session'>;
  route: {
    params: {
      sessionId?: string;
      mode: 'create' | 'join';
    };
  };
};

type Participant = {
  uid: string;
  displayName: string;
  photoURL: string;
  status: 'pending' | 'accepted';
};

const { width, height } = Dimensions.get('window');

const SessionScreen: React.FC<SessionProps> = ({ navigation, route }) => {
  const { user } = useAuth();
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [sessionData, setSessionData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [selectedParticipant, setSelectedParticipant] = useState<Participant | null>(null);
  const [showParticipantInfo, setShowParticipantInfo] = useState(false);

  const fetchOrCreateSession = useCallback(async () => {
    try {
      let currentSessionId = route.params?.sessionId;
      const mode = route.params.mode;
      
      if (mode === 'create') {
        currentSessionId = Math.random().toString(36).substring(2, 8).toUpperCase();
        const sessionRef = doc(firestore, 'sessions', currentSessionId);
        await setDoc(sessionRef, {
          createdBy: user?.uid,
          participants: [{
            uid: user?.uid,
            displayName: user?.displayName,
            photoURL: user?.photoURL,
            status: 'accepted'
          }],
          createdAt: Timestamp.now(),
          status: 'active',
        });
        setIsAdmin(true);
      } else if (mode === 'join') {
        const sessionRef = doc(firestore, 'sessions', currentSessionId);
        const sessionSnapshot = await getDocs(query(collection(firestore, 'users'), where('uid', '==', user?.uid)));
        const userData = sessionSnapshot.docs[0]?.data();
        await updateDoc(sessionRef, {
          participants: [{
            uid: user?.uid,
            displayName: userData?.name || user?.displayName,
            photoURL: userData?.profileImage || user?.photoURL,
            status: 'pending'
          }]
        });
      }
  
      setSessionId(currentSessionId);
      const sessionRef = doc(firestore, 'sessions', currentSessionId);
      
      const unsubscribe = onSnapshot(sessionRef, (doc) => {
        if (doc.exists()) {
          const data = doc.data();
          setSessionData(data);
          setIsAdmin(data.createdBy === user?.uid);
        } else {
          Alert.alert('Session not found', 'Please try again or create a new session');
          navigation.navigate('Home');
        }
        setIsLoading(false);
      });
  
      return () => unsubscribe();
    } catch (error) {
      console.error('Error in fetchOrCreateSession:', error);
      if (error instanceof Error) {
        Alert.alert('Error', `Failed to join or create session: ${error.message}`);
      } else {
        Alert.alert('Error', 'An unknown error occurred');
      }
      navigation.navigate('Home');
    }
  }, [route.params, user, navigation]);
  
  useEffect(() => {
    fetchOrCreateSession();
  }, [fetchOrCreateSession]);

  const startChat = () => {
    if (sessionId && sessionData?.participants?.filter((p: Participant) => p.status === 'accepted').length >= 2) {
      navigation.navigate('Chats', { sessionId });
    } else {
      Alert.alert('Not enough participants', 'At least two accepted participants are required to start the chat.');
    }
  };

  const leaveSession = async () => {
    if (!sessionId || !user || !sessionData) return;

    try {
      const updatedParticipants = sessionData.participants.filter((p: Participant) => p.uid !== user.uid);
      if (updatedParticipants.length === 0) {
        await deleteDoc(doc(firestore, 'sessions', sessionId));
      } else {
        await updateDoc(doc(firestore, 'sessions', sessionId), {
          participants: updatedParticipants
        });
      }
      Alert.alert('Success', 'You have left the session');
      navigation.navigate('Home');
    } catch (error) {
      console.error('Error leaving session:', error);
      Alert.alert('Error', 'Failed to leave session. Please try again.');
    }
  };

  const acceptParticipant = async (participantUid: string) => {
    if (!sessionId || !isAdmin) return;

    try {
      const updatedParticipants = sessionData.participants.map((p: Participant) => 
        p.uid === participantUid ? { ...p, status: 'accepted' } : p
      );
      await updateDoc(doc(firestore, 'sessions', sessionId), {
        participants: updatedParticipants
      });
      Alert.alert('Success', 'Participant accepted');
    } catch (error) {
      console.error('Error accepting participant:', error);
      Alert.alert('Error', 'Failed to accept participant. Please try again.');
    }
  };

  const removeParticipant = async (participantUid: string) => {
    if (!sessionId || !isAdmin) return;

    try {
      const updatedParticipants = sessionData.participants.filter((p: Participant) => p.uid !== participantUid);
      await updateDoc(doc(firestore, 'sessions', sessionId), {
        participants: updatedParticipants
      });
      Alert.alert('Success', 'Participant removed');
    } catch (error) {
      console.error('Error removing participant:', error);
      Alert.alert('Error', 'Failed to remove participant. Please try again.');
    }
  };

  const viewParticipantInfo = (participant: Participant) => {
    setSelectedParticipant(participant);
    setShowParticipantInfo(true);
  };

  const renderParticipant = ({ item }: { item: Participant }) => (
    <Animatable.View animation="fadeIn" duration={500}>
      <TouchableOpacity
        style={styles.participantItem}
        onPress={() => isAdmin && viewParticipantInfo(item)}
      >
        <Image source={{ uri: item.photoURL || 'https://via.placeholder.com/150' }} style={styles.participantPhoto} />
        <Text style={styles.participantText}>{item.displayName}</Text>
        {isAdmin && item.uid !== user?.uid && (
          <View style={styles.adminControls}>
            {item.status === 'pending' && (
              <TouchableOpacity onPress={() => acceptParticipant(item.uid)} style={styles.iconButton}>
                <Ionicons name="checkmark-circle-outline" size={24} color="#4CAF50" />
              </TouchableOpacity>
            )}
            <TouchableOpacity onPress={() => removeParticipant(item.uid)} style={styles.iconButton}>
              <Ionicons name="close-circle-outline" size={24} color="#FF3B30" />
            </TouchableOpacity>
          </View>
        )}
      </TouchableOpacity>
    </Animatable.View>
  );

  if (isLoading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#ffffff" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.navigate('Home')} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity onPress={leaveSession} style={styles.leaveButton}>
            <Ionicons name="exit-outline" size={24} color="#fff" />
            <Text style={styles.leaveButtonText}>Leave</Text>
          </TouchableOpacity>
        </View>
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
            {isAdmin ? 'Session Admin Panel' : 'Session Lobby'}
          </Animatable.Text>
          <Animatable.Text 
            animation="fadeIn" 
            duration={1000} 
            style={styles.infoText}
          >
            Session ID: {sessionId}
          </Animatable.Text>
          <Animatable.Text 
            animation="fadeIn" 
            duration={1000} 
            style={styles.infoText}
          >
            Participants: {sessionData?.participants?.filter((p: Participant) => p.status === 'accepted').length || 0}
          </Animatable.Text>
          {isAdmin && (
            <Animatable.Text 
              animation="fadeIn" 
              duration={1000} 
              style={styles.infoText}
            >
              Pending: {sessionData?.participants?.filter((p: Participant) => p.status === 'pending').length || 0}
            </Animatable.Text>
          )}
            <FlatList
            data={sessionData?.participants}
            renderItem={renderParticipant}
            keyExtractor={(item) => item.uid}
            style={styles.participantList}
          />
          {isAdmin && (
            <TouchableOpacity 
              style={[
                styles.startButton, 
                sessionData?.participants?.filter((p: Participant) => p.status === 'accepted').length < 2 && styles.disabledButton
              ]} 
              onPress={startChat}
              disabled={sessionData?.participants?.filter((p: Participant) => p.status === 'accepted').length < 2}
            >
              <Text style={styles.startButtonText}>Start Chat</Text>
            </TouchableOpacity>
          )}
        </Animatable.View>
      </SafeAreaView>
      <Modal
        visible={showParticipantInfo}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowParticipantInfo(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Image source={{ uri: selectedParticipant?.photoURL || 'https://via.placeholder.com/150' }} style={styles.modalPhoto} />
            <Text style={styles.modalName}>{selectedParticipant?.displayName}</Text>
            <Text style={styles.modalStatus}>Status: {selectedParticipant?.status}</Text>
            <TouchableOpacity style={styles.closeButton} onPress={() => setShowParticipantInfo(false)}>
              <Text style={styles.closeButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginTop: 35,
    paddingTop: 20,
  },
  backButton: {
    padding: 10,
  },
  leaveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#5e86f5',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
  },
  leaveButtonText: {
    color: '#fff',
    marginLeft: 5,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 30,
  },
  title: {
    fontSize: 28,
    color: '#FFFFFF',
    fontWeight: 'bold',
    marginBottom: 20,
    marginTop: 30,
    textAlign: 'center',
  },
  infoText: {
    fontSize: 16,
    color: '#888',
    marginBottom: 10,
  },
  startButton: {
    backgroundColor: '#5e86f5',
    paddingVertical: 15,
    paddingHorizontal: 24,
    borderRadius: 25,
    marginTop: 20,
    alignItems: 'center',
    width: '100%',
  },
  disabledButton: {
    backgroundColor: '#888',
  },
  startButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  participantList: {
    maxHeight: height * 0.3,
    width: '100%',
    marginVertical: 20,
  },
  participantItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  participantPhoto: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 10,
  },
  participantText: {
    color: '#fff',
    fontSize: 16,
    flex: 1,
  },
  adminControls: {
    flexDirection: 'row',
  },
  iconButton: {
    padding: 5,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: '#1a1a1a',
    padding: 20,
    borderRadius: 10,
    alignItems: 'center',
    width: width * 0.8,
  },
  modalPhoto: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 10,
  },
  modalName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 5,
  },
  modalStatus: {
    fontSize: 18,
    color: '#888',
    marginBottom: 20,
  },
  closeButton: {
    backgroundColor: '#5e86f5',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 25,
  },
  closeButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default SessionScreen;