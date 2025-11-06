import { useState, useEffect } from 'react';
import { db } from '@/firebase';
import { collection, query, where, onSnapshot, addDoc, serverTimestamp, orderBy, or } from 'firebase/firestore';
import { useAuth } from './useAuth';

// Define the shape of a chat message
interface ChatMessage {
  id: string;
  senderId: string;
  receiverId: string;
  senderName: string;
  message: string;
  createdAt: any; // Firestore timestamp object
}

export const useChat = (partnerId: string | null) => {
  const { user, loading: authLoading } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Don't do anything if auth is loading, or there is no user or chat partner
    if (authLoading || !user || !partnerId) {
      setLoading(false);
      setMessages([]); // Clear messages if there's no partner
      return;
    }

    setLoading(true);

    // This query is complex. It needs to find messages where:
    // (sender is me AND receiver is them) OR (sender is them AND receiver is me)
    // Note: Firestore doesn't support complex OR queries, so we filter client-side
    const messagesQuery = query(
      collection(db, 'chats'),
      orderBy('createdAt', 'asc')
    );
    
    const unsubscribe = onSnapshot(messagesQuery, (querySnapshot) => {
        const fetchedMessages = querySnapshot.docs
            .map(doc => ({
                id: doc.id,
                ...doc.data(),
            } as ChatMessage))
            // Double-check the filtering client-side, as Firestore's OR queries can be complex
            .filter(msg => 
                (msg.senderId === user.uid && msg.receiverId === partnerId) ||
                (msg.senderId === partnerId && msg.receiverId === user.uid)
            );

      setMessages(fetchedMessages);
      setLoading(false);
    }, (err) => {
      console.error("Error fetching chat messages: ", err);
      setError("Failed to load chat messages.");
      setLoading(false);
    });

    // Cleanup subscription on component unmount or when dependencies change
    return () => unsubscribe();

  }, [user, partnerId, authLoading]);

  // Function to send a message
  const sendMessage = async (message: string) => {
    if (!user || !partnerId || !message.trim()) {
      setError("Cannot send message. Invalid user, partner, or message.");
      return { success: false };
    }

    try {
      await addDoc(collection(db, 'chats'), {
        senderId: user.uid,
        receiverId: partnerId,
        senderName: user.nomeCompleto, // Include sender's name
        message: message.trim(),
        createdAt: serverTimestamp(),
      });
      return { success: true };
    } catch (err) {
      console.error("Error sending message: ", err);
      setError("Failed to send message.");
      return { success: false };
    }
  };

  return { messages, loading, error, sendMessage };
};
