// src/services/chat.ts
import { db } from '../firebase';
import { 
  collection, 
  addDoc, 
  getDocs, 
  query, 
  where, 
  onSnapshot,
  Timestamp,
  deleteDoc,
  doc,
  getDoc
} from 'firebase/firestore';
import { getCurrentUser } from './auth';
import { generateSessionKey, encryptMessage, decryptMessage } from '../utils/encryption';

export const createSession = async (): Promise<{ sessionId: string; accessKey: string }> => {
  const user = getCurrentUser();
  if (!user) throw new Error('User not authenticated');

  const accessKey = generateSessionKey();
  const encryptedAccessKey = encryptMessage(accessKey, accessKey);
  
  try {
    const sessionRef = await addDoc(collection(db, 'sessions'), {
      createdBy: user.uid,
      createdAt: Timestamp.now(),
      accessKey: encryptedAccessKey
    });

    return { sessionId: sessionRef.id, accessKey };
  } catch (error) {
    console.error('Error creating session:', error);
    throw new Error('Failed to create session');
  }
};

export const joinSession = async (sessionId: string, accessKey: string): Promise<void> => {
  try {
    const sessionDoc = await getDoc(doc(db, 'sessions', sessionId));

    if (!sessionDoc.exists()) throw new Error('Session not found');

    const sessionData = sessionDoc.data();
    const decryptedAccessKey = decryptMessage(sessionData.accessKey, accessKey);

    if (decryptedAccessKey !== accessKey) throw new Error('Invalid access key');
  } catch (error) {
    console.error('Error joining session:', error);
    throw error;
  }
};

export const sendMessage = async (sessionId: string, message: string, accessKey: string): Promise<void> => {
  const user = getCurrentUser();
  if (!user) throw new Error('User not authenticated');

  const encryptedMessage = encryptMessage(message, accessKey);

  try {
    await addDoc(collection(db, `sessions/${sessionId}/messages`), {
      text: encryptedMessage,
      sender: user.uid,
      timestamp: Timestamp.now()
    });
  } catch (error) {
    console.error('Error sending message:', error);
    throw new Error('Failed to send message');
  }
};

export const subscribeToMessages = (sessionId: string, accessKey: string, callback: (messages: any[]) => void) => {
  const messagesQuery = query(collection(db, `sessions/${sessionId}/messages`));
  
  return onSnapshot(messagesQuery, (snapshot) => {
    const messages = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        text: decryptMessage(data.text, accessKey)
      };
    });
    callback(messages);
  }, (error) => {
    console.error('Error subscribing to messages:', error);
  });
};

export const endSession = async (sessionId: string): Promise<void> => {
  try {
    const messagesQuery = query(collection(db, `sessions/${sessionId}/messages`));
    const messagesDocs = await getDocs(messagesQuery);

    // Delete all messages
    const deletePromises = messagesDocs.docs.map(doc => deleteDoc(doc.ref));
    await Promise.all(deletePromises);

    // Delete the session
    await deleteDoc(doc(db, 'sessions', sessionId));
  } catch (error) {
    console.error('Error ending session:', error);
    throw new Error('Failed to end session');
  }
};