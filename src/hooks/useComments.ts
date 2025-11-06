import { useState, useEffect, useCallback } from 'react';
import { db } from '@/firebase'; // Import db from your Firebase config
import { collection, query, where, onSnapshot, addDoc, serverTimestamp, orderBy, doc, updateDoc, arrayUnion } from 'firebase/firestore';
import { useAuth } from './useAuth';

// Define the shape of a comment
interface Comment {
  id: string;
  questionId: string;
  userId: string;
  userName: string;
  userType: 'aluno' | 'professor';
  message: string;
  createdAt: any; // Firestore timestamp object
  responses: Response[];
}

// Define the shape of a response
interface Response {
  id: string;
  userId: string;
  userName: string;
  userType: 'aluno' | 'professor';
  message: string;
  createdAt: any; // Firestore timestamp object
}

export const useComments = () => {
  const { user, loading: authLoading } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // This effect will set up the real-time listener
  useEffect(() => {
    // Dont start fetching if auth is still loading
    if (authLoading) {
      return;
    }

    setLoading(true);

    // Query for all comments, ordered by creation date
    const commentsQuery = query(collection(db, 'comments'), orderBy('createdAt', 'desc'));

    // onSnapshot returns an unsubscribe function
    const unsubscribe = onSnapshot(commentsQuery, (querySnapshot) => {
      const fetchedComments = querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          questionId: data.questionId,
          userId: data.userId,
          userName: data.userName,
          userType: data.userType,
          message: data.message,
          createdAt: data.createdAt,
          // Ensure responses is always an array
          responses: Array.isArray(data.responses) ? data.responses : [],
        };
      });
      setComments(fetchedComments);
      setLoading(false);
    }, (err) => {
      console.error("Error fetching comments: ", err);
      setError("Failed to load comments in real-time.");
      setLoading(false);
    });

    // Cleanup function to unsubscribe when the component unmounts
    return () => unsubscribe();

  }, [authLoading]); // Rerun effect if authLoading changes

  // Function to add a new comment
  const addComment = async (questionId: string, questionTheme: string, questionText: string, message: string) => {
    if (!user) {
      setError("User not authenticated.");
      return { success: false };
    }
    try {
      await addDoc(collection(db, 'comments'), {
        questionId,
        questionTheme,
        questionText,
        userId: user.uid,
        userName: user.nomeCompleto,
        userType: user.userType,
        message,
        createdAt: serverTimestamp(),
        responses: [],
      });
      return { success: true };
    } catch (err) {
      console.error("Error adding comment: ", err);
      setError("Failed to post comment.");
      return { success: false };
    }
  };

  // Function to add a response to a comment
  const addResponse = async (commentId: string, message: string) => {
    if (!user) {
      setError("User not authenticated.");
      return { success: false };
    }
    
    // This is more complex with Firestore listeners, as it requires updating an array within a document.
    // For this example, we'll keep it simple, but a real-world scenario might use a subcollection.
    // The current listener will automatically pick up this change.
    try {
        const commentRef = doc(db, "comments", commentId);
        await updateDoc(commentRef, {
            responses: arrayUnion({
                id: new Date().toISOString(), // Simple unique ID
                userId: user.uid,
                userName: user.nomeCompleto,
                userType: user.userType,
                message,
                createdAt: serverTimestamp()
            })
        });
        return { success: true };
    } catch (err) {
        console.error("Error adding response: ", err);
        setError("Failed to post response.");
        return { success: false };
    }
  };

  return { comments, loading, error, addComment, addResponse };
};
