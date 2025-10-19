import React, { createContext, useContext, useState, ReactNode, useCallback, useMemo, useEffect, useRef } from 'react';
import { useAuth } from './AuthContext';
import { useNotifications } from './NotificationContext';
import { ChatMessage, Conversation } from '../types';

interface ChatContextType {
  conversations: Conversation[];
  activeConversation: Conversation | null;
  isChatOpen: boolean;
  totalUnreadCount: number;
  openConversation: (conversationId: string) => void;
  toggleChat: () => void;
  backToList: () => void;
  sendMessage: (text: string, attachment?: File) => void;
  closeConversation: (conversationId: string) => void;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export const useChat = () => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
};

const INACTIVITY_TIMEOUT = 20 * 60 * 1000; // 20 minutos

export const ChatProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [conversations, setConversations] = useState<{ [key: string]: Conversation }>({});
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [autoReplySent, setAutoReplySent] = useState<{ [key: string]: boolean }>({});
  const [inactivityTimers, setInactivityTimers] = useState<{ [key: string]: NodeJS.Timeout }>({});
  const { user } = useAuth();
  const { addNotification } = useNotifications();

  const conversationsRef = useRef(conversations);
  conversationsRef.current = conversations;

  // Limpeza de timers e URLs ao desmontar
  useEffect(() => {
    return () => {
      Object.values(inactivityTimers).forEach(clearTimeout);
      Object.values(conversationsRef.current).forEach(conv => {
        conv.messages.forEach(msg => {
          if (msg.attachment?.url.startsWith('blob:')) {
            URL.revokeObjectURL(msg.attachment.url);
          }
        });
      });
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const closeConversation = useCallback((conversationId: string) => {
    setConversations(prev => {
      const newConvs = { ...prev };
      const convToClose = newConvs[conversationId];

      // Limpa blob URLs para evitar memory leaks
      if (convToClose) {
        convToClose.messages.forEach(msg => {
          if (msg.attachment?.url.startsWith('blob:')) {
            URL.revokeObjectURL(msg.attachment.url);
          }
        });
      }

      delete newConvs[conversationId];
      return newConvs;
    });

    if (inactivityTimers[conversationId]) {
      clearTimeout(inactivityTimers[conversationId]);
      setInactivityTimers(prev => {
        const newTimers = { ...prev };
        delete newTimers[conversationId];
        return newTimers;
      });
    }
    if (activeConversationId === conversationId) {
      setActiveConversationId(null);
      setIsChatOpen(false);
    }
  }, [activeConversationId, inactivityTimers]);

  const startInactivityTimer = useCallback((conversationId: string) => {
    if (inactivityTimers[conversationId]) {
      clearTimeout(inactivityTimers[conversationId]);
    }

    const timer = setTimeout(() => {
      setConversations(prev => {
        const conv = prev[conversationId];
        if (!conv) return prev;
        const closingMessage: ChatMessage = {
          id: new Date().toISOString() + '-closing',
          senderId: 'system',
          senderName: 'Sistema',
          text: 'Chat fechado por falta de comunicação.',
          timestamp: new Date().toISOString(),
        };
        return {
          ...prev,
          [conversationId]: {
            ...conv,
            messages: [...conv.messages, closingMessage],
          }
        };
      });
      // Atraso para o usuário ver a mensagem antes de fechar
      setTimeout(() => closeConversation(conversationId), 3000);
    }, INACTIVITY_TIMEOUT);

    setInactivityTimers(prev => ({ ...prev, [conversationId]: timer }));
  }, [inactivityTimers, closeConversation]);

  const toggleChat = () => {
    if (isChatOpen) {
      setIsChatOpen(false);
      if (user?.role === 'receptor') {
        setActiveConversationId(null);
      }
    } else {
      setIsChatOpen(true);
      if (user && user.userType !== 'funcionario') {
        const convId = user.id;
        setActiveConversationId(convId);
        
        setConversations(prev => {
          const existingConv = prev[convId];
          if (existingConv) {
            if (existingConv.unreadByClient > 0) {
              return { ...prev, [convId]: { ...existingConv, unreadByClient: 0 } };
            }
            return prev;
          } else {
            startInactivityTimer(convId);
            return {
              ...prev,
              [convId]: {
                id: convId,
                clientName: user.name,
                messages: [],
                unreadByReceptor: 0,
                unreadByClient: 0,
                lastMessageTimestamp: new Date().toISOString(),
              },
            };
          }
        });
      }
    }
  };
  
  const openConversation = (conversationId: string) => {
    setActiveConversationId(conversationId);
    setConversations(prev => {
      const conv = prev[conversationId];
      if (conv && conv.unreadByReceptor > 0) {
        return { ...prev, [conversationId]: { ...conv, unreadByReceptor: 0 } };
      }
      return prev;
    });
  };

  const backToList = () => {
    setActiveConversationId(null);
  };

  const sendMessage = useCallback((text: string, attachment?: File) => {
    if (!user || (!text.trim() && !attachment)) return;

    const convId = user.role === 'receptor' ? activeConversationId : user.id;
    if (!convId) return;

    let attachmentData;
    if (attachment) {
        attachmentData = {
            name: attachment.name,
            url: URL.createObjectURL(attachment),
        };
    }

    const newMessage: ChatMessage = {
      id: new Date().toISOString(),
      senderId: user.id,
      senderName: user.name.split(' ')[0],
      text: text,
      timestamp: new Date().toISOString(),
      attachment: attachmentData,
    };

    if (user.userType !== 'funcionario') {
      addNotification(`Nova mensagem no chat de ${user.name}`, { recipientRole: 'receptor' });
    } else {
      addNotification(`Você tem uma nova mensagem de ${user.name}`, { recipientId: convId });
    }

    setConversations(prev => {
      const existingConv = prev[convId] || {
        id: convId,
        clientName: user.userType !== 'funcionario' ? user.name : (Object.values(prev).find(c => c.id === convId)?.clientName || 'Cliente Desconhecido'),
        messages: [],
        unreadByReceptor: 0,
        unreadByClient: 0,
        lastMessageTimestamp: new Date().toISOString(),
      };

      const updatedMessages = [...existingConv.messages, newMessage];
      let unreadByReceptor = existingConv.unreadByReceptor;
      let unreadByClient = existingConv.unreadByClient;

      if (user.userType !== 'funcionario') {
        unreadByReceptor += 1;
      } else {
        unreadByClient += 1;
      }

      const updatedConv = {
        ...existingConv,
        messages: updatedMessages,
        unreadByReceptor,
        unreadByClient,
        lastMessageTimestamp: new Date().toISOString(),
      };

      return { ...prev, [convId]: updatedConv };
    });

    startInactivityTimer(convId);

    if (user.userType !== 'funcionario' && !autoReplySent[convId]) {
      setTimeout(() => {
        const autoReply: ChatMessage = {
          id: new Date().toISOString() + 'reply',
          senderId: 'receptor_bot',
          senderName: 'Funcionário',
          text: `Olá, ${user.name.split(' ')[0]}! Recebemos sua mensagem e em breve um de nossos funcionários irá atendê-lo.`,
          timestamp: new Date().toISOString(),
        };
        setConversations(currentConvs => {
          const currentConvForReply = currentConvs[convId];
          if (!currentConvForReply) return currentConvs;
          return {
            ...currentConvs,
            [convId]: {
              ...currentConvForReply,
              messages: [...currentConvForReply.messages, autoReply],
              unreadByClient: currentConvForReply.unreadByClient + 1,
            }
          };
        });
        setAutoReplySent(prev => ({ ...prev, [convId]: true }));
      }, 1500);
    }
  }, [user, activeConversationId, addNotification, autoReplySent, startInactivityTimer]);

  const sortedConversations = useMemo(() => {
    return Object.values(conversations).sort((a, b) => 
      new Date(b.lastMessageTimestamp).getTime() - new Date(a.lastMessageTimestamp).getTime()
    );
  }, [conversations]);
  
  const activeConversation = activeConversationId ? conversations[activeConversationId] : null;

  const totalUnreadCount = useMemo(() => {
    if (!user) return 0;
    if (user.role === 'receptor') {
      return sortedConversations.reduce((acc, c) => acc + c.unreadByReceptor, 0);
    }
    if (user.userType !== 'funcionario' && conversations[user.id]) {
      return conversations[user.id].unreadByClient;
    }
    return 0;
  }, [user, conversations, sortedConversations]);

  const value = {
    conversations: sortedConversations,
    activeConversation,
    isChatOpen,
    totalUnreadCount,
    openConversation,
    toggleChat,
    backToList,
    sendMessage,
    closeConversation,
  };

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
};
