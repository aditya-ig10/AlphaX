import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
} from 'react-native';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { firestore } from '../firebase';
import { Ionicons } from '@expo/vector-icons';

interface User {
  id: string;
  name: string;
  photoURL: string;
  isOnline: boolean;
}

const ActiveUsers: React.FC = () => {
  const [activeUsers, setActiveUsers] = useState<User[]>([]);

  useEffect(() => {
    const usersRef = collection(firestore, 'users');
    const q = query(usersRef, where('isOnline', '==', true));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const users: User[] = [];
      snapshot.forEach((doc) => {
        users.push({ id: doc.id, ...doc.data() } as User);
      });
      setActiveUsers(users);
    });

    return () => unsubscribe();
  }, []);

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.container}>
      {activeUsers.map((user) => (
        <TouchableOpacity key={user.id} style={styles.userItem}>
          <Image source={{ uri: user.photoURL }} style={styles.userImage} />
          <Text style={styles.userName}>{user.name}</Text>
          <View style={styles.onlineIndicator} />
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingLeft: 20,
    marginBottom: 20,
  },
  userItem: {
    alignItems: 'center',
    marginRight: 20,
  },
  userImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginBottom: 5,
  },
  userName: {
    color: '#fff',
    fontSize: 12,
  },
  onlineIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#4CAF50',
    position: 'absolute',
    right: 0,
    top: 0,
    borderWidth: 2,
    borderColor: '#4B0082',
  },
});

export default ActiveUsers;