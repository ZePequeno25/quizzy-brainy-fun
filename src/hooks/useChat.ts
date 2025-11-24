import { useState, useEffect, useCallback } from 'react';
import { apiFetch } from '@/lib/api';
import { useAuth } from './useAuth';

// Define the shape of a chat message
interface ChatMessage {
  id: string;
  senderId?: string;
  sender_id?: string;
  receiverId?: string;
  receiver_id?: string;
  senderName?: string;
  sender_name?: string;
  message: string;
  createdAt?: string;
  created_at?: string;
}

// Normalize message data from API to frontend format
const normalizeMessage = (msg: any): ChatMessage => {
  return {
    id: msg.id,
    senderId: msg.sender_id || msg.senderId,
    receiverId: msg.receiver_id || msg.receiverId,
    senderName: msg.sender_name || msg.senderName,
    message: msg.message,
    createdAt: msg.created_at || msg.createdAt,
  };
};

export const useChat = (partnerId: string | null, isActive: boolean = false) => {
  const { user, loading: authLoading } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);

  // Fetch messages from API (only when active)
  const fetchMessages = useCallback(async (showLoading: boolean = false) => {
    if (authLoading || !user || !partnerId || !isActive) {
      if (!isActive) {
        setLoading(false);
      }
      return;
    }

    if (showLoading) {
      setLoading(true);
    }
    setError(null);

    try {
      const response = await apiFetch(`/chat?senderId=${user.uid}&receiverId=${partnerId}`);
      
      if (!response.ok) {
        throw new Error('Falha ao carregar mensagens');
      }

      const data = await response.json();
      const normalizedMessages = Array.isArray(data) 
        ? data.map(normalizeMessage).sort((a, b) => {
            const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
            const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
            return dateA - dateB;
          })
        : [];
      
      // Remove temporary messages and merge with real messages
      setMessages(prev => {
        const tempMessages = prev.filter(m => m.id.startsWith('temp-'));
        const realMessages = normalizedMessages;
        
        // If we have temp messages, keep them if they're not in real messages yet
        // Otherwise, use only real messages
        if (tempMessages.length > 0) {
          // Check if any temp message content matches a real message (within last 2 seconds)
          const twoSecondsAgo = Date.now() - 2000;
          const merged = [...realMessages];
          
          tempMessages.forEach(temp => {
            const exists = realMessages.some(real => 
              real.message === temp.message && 
              real.senderId === temp.senderId &&
              real.createdAt && 
              new Date(real.createdAt).getTime() > twoSecondsAgo
            );
            if (!exists) {
              merged.push(temp);
            }
          });
          
          return merged.sort((a, b) => {
            const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
            const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
            return dateA - dateB;
          });
        }
        
        return realMessages;
      });
      
      setHasLoadedOnce(true);
    } catch (err: any) {
      console.error("Error fetching chat messages: ", err);
      setError(err.message || "Falha ao carregar mensagens");
    } finally {
      if (showLoading) {
        setLoading(false);
      }
    }
  }, [user, partnerId, authLoading, isActive]);

  // Load messages only when chat becomes active
  useEffect(() => {
    if (isActive && !hasLoadedOnce && !authLoading && user && partnerId) {
      fetchMessages(true); // Show loading on first load
    } else if (!isActive) {
      // Reset when chat closes
      setHasLoadedOnce(false);
      setMessages([]);
    }
  }, [isActive, hasLoadedOnce, authLoading, user, partnerId, fetchMessages]);

  // Poll for updates only when chat is active (optimized: every 10 seconds instead of 2)
  useEffect(() => {
    if (!isActive || !hasLoadedOnce || authLoading || !user || !partnerId) {
      return;
    }

    // Poll less frequently to save data
    const interval = setInterval(() => {
      fetchMessages(false); // Don't show loading spinner on polling
    }, 10000); // 10 seconds instead of 2

    return () => clearInterval(interval);
  }, [isActive, hasLoadedOnce, authLoading, user, partnerId, fetchMessages]);

  // Function to send a message
  const sendMessage = async (message: string) => {
    if (!user || !partnerId || !message.trim()) {
      setError("Não é possível enviar mensagem. Usuário, parceiro ou mensagem inválidos.");
      return { success: false };
    }

    try {
      const response = await apiFetch('/chat', {
        method: 'POST',
        body: JSON.stringify({
          receiverId: partnerId,
          message: message.trim(),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Falha ao enviar mensagem');
      }

      // Optimistically add message to UI (don't wait for refresh)
      const tempMessage: ChatMessage = {
        id: `temp-${Date.now()}`,
        senderId: user.uid,
        senderName: user.nomeCompleto,
        message: message.trim(),
        createdAt: new Date().toISOString(),
      };
      setMessages(prev => [...prev, tempMessage]);

      // Refresh messages after sending (silently, no loading spinner)
      setTimeout(() => {
        fetchMessages(false);
      }, 500);

      return { success: true };
    } catch (err: any) {
      console.error("Error sending message: ", err);
      setError(err.message || "Falha ao enviar mensagem");
      // Remove temp message on error
      setMessages(prev => prev.filter(m => !m.id.startsWith('temp-')));
      return { success: false };
    }
  };

  return { messages, loading, error, sendMessage };
};
