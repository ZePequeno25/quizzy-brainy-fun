import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAuth } from "@/hooks/useAuth";
import { MessageCircle, Send, Minimize2, X, User } from "lucide-react";
import { apiFetch } from "@/lib/api";

interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderType: 'aluno' | 'professor';
  receiverId: string;
  message: string;
  createdAt: string;
}

interface ChatWindowProps {
  isOpen: boolean;
  onClose: () => void;
  onMinimize: () => void;
  chattingWith?: {
    id: string;
    name: string;
    type: 'aluno' | 'professor';
  };
}

const ChatWindow = ({ isOpen, onClose, onMinimize, chattingWith }: ChatWindowProps) => {
  const { user } = useAuth();
  const userId = user?.uid || 'guest';
  
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    const saved = localStorage.getItem(`chatMessages_${userId}_${chattingWith?.id || 'default'}`);
    return saved ? JSON.parse(saved) : [];
  });
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    if (chattingWith) {
      localStorage.setItem(`chatMessages_${userId}_${chattingWith.id}`, JSON.stringify(messages));
    }
  }, [messages, chattingWith, userId]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const loadMessages = async () => {
    if (!user || !chattingWith) return;

    try {
      const response = await apiFetch(
        `/api/chat/${user.uid}/${chattingWith.id}`
      );
      if (response.ok) {
        const data = await response.json();
        setMessages(data);
        if (chattingWith) {
          localStorage.setItem(`chatMessages_${userId}_${chattingWith.id}`, JSON.stringify(data));
        }
      }
    } catch (error) {
      console.error('Erro ao carregar mensagens:', error);
    }
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !user || !chattingWith) return;

    setLoading(true);
    try {
      const response = await apiFetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          senderId: user.uid,
          senderName: user.nomeCompleto,
          senderType: user.userType,
          receiverId: chattingWith.id,
          message: newMessage.trim()
        })
      });

      if (response.ok) {
        setNewMessage("");
        loadMessages();
      }
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && chattingWith) {
      loadMessages();
      const interval = setInterval(loadMessages, 3000); // Atualizar a cada 3 segundos
      return () => clearInterval(interval);
    }
  }, [isOpen, chattingWith, user]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  if (!isOpen || !chattingWith) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 w-80 h-96 z-50">
      <Card className="h-full shadow-lg border-2">
        <CardHeader className="p-3 bg-purple-600 text-white rounded-t-lg">
          <CardTitle className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <MessageCircle className="w-4 h-4" />
              <span>Chat com {chattingWith.name}</span>
              <Badge variant="secondary" className="text-xs">
                {chattingWith.type === 'professor' ? 'Professor' : 'Aluno'}
              </Badge>
            </div>
            <div className="flex gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={onMinimize}
                className="h-6 w-6 p-0 text-white hover:bg-purple-700"
              >
                <Minimize2 className="w-3 h-3" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="h-6 w-6 p-0 text-white hover:bg-purple-700"
              >
                <X className="w-3 h-3" />
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        
        <CardContent className="p-0 h-full flex flex-col">
          {/* Área de mensagens */}
          <ScrollArea className="flex-1 p-3">
            <div className="space-y-3">
              {messages.length === 0 ? (
                <div className="text-center text-gray-500 py-8">
                  <MessageCircle className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                  <p className="text-sm">Inicie uma conversa!</p>
                </div>
              ) : (
                messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${
                      message.senderId === user?.uid ? 'justify-end' : 'justify-start'
                    }`}
                  >
                    <div
                      className={`max-w-[70%] p-2 rounded-lg text-sm ${
                        message.senderId === user?.uid
                          ? 'bg-purple-600 text-white'
                          : 'bg-gray-200 text-gray-800'
                      }`}
                    >
                      <div className="flex items-center gap-1 mb-1">
                        <User className="w-3 h-3" />
                        <span className="text-xs font-medium">
                          {message.senderName}
                        </span>
                      </div>
                      <p>{message.message}</p>
                      <p className={`text-xs mt-1 ${
                        message.senderId === user?.uid 
                          ? 'text-purple-200' 
                          : 'text-gray-500'
                      }`}>
                        {new Date(message.createdAt).toLocaleTimeString('pt-BR', {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>

          {/* Formulário de envio */}
          <div className="p-3 border-t">
            <form onSubmit={sendMessage} className="flex gap-2">
              <Input
                placeholder="Digite sua mensagem..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                className="flex-1 text-sm"
                disabled={loading}
              />
              <Button
                type="submit"
                size="sm"
                disabled={loading || !newMessage.trim()}
                className="bg-purple-600 hover:bg-purple-700"
              >
                <Send className="w-3 h-3" />
              </Button>
            </form>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ChatWindow;