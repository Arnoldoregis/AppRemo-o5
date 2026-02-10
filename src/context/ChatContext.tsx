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
  // Carrega conversas do localStorage para simular um banco de dados compartilhado entre abas
  const [conversations, setConversations] = useState<{ [key: string]: Conversation }>(() => {
    try {
      const stored = localStorage.getItem('mock_chat_db');
      return stored ? JSON.parse(stored) : {};
    } catch {
      return {};
    }
  });

  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [autoReplySent, setAutoReplySent] = useState<{ [key: string]: boolean }>({});
  const [inactivityTimers, setInactivityTimers] = useState<{ [key: string]: ReturnType<typeof setTimeout> }>({});
  
  const { user } = useAuth();
  const { addNotification } = useNotifications();

  // Lógica para usuário convidado (Guest) - ALTERADO PARA sessionStorage
  // sessionStorage garante que cada aba tenha um ID único, mas sobrevive a refresh da página
  const [guestId] = useState(() => {
    const stored = sessionStorage.getItem('chat_guest_id');
    if (stored) return stored;
    const newId = 'guest_' + Math.random().toString(36).substr(2, 9);
    sessionStorage.setItem('chat_guest_id', newId);
    return newId;
  });

  // Sincroniza conversas entre abas (Simulação de Realtime)
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'mock_chat_db' && e.newValue) {
        setConversations(JSON.parse(e.newValue));
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // Função auxiliar para atualizar estado e persistir no localStorage (Sync)
  const updateConversations = (callback: (prev: { [key: string]: Conversation }) => { [key: string]: Conversation }) => {
    setConversations(prev => {
      const newState = callback(prev);
      localStorage.setItem('mock_chat_db', JSON.stringify(newState));
      return newState;
    });
  };

  // Determina o usuário atual (Logado ou Convidado)
  const currentUser = useMemo(() => {
    if (user) return user;
    return {
      id: guestId,
      name: 'Visitante',
      userType: 'pessoa_fisica', // Trata como cliente PF para lógica do chat
      role: 'guest',
      email: '',
      phone: '',
      address: { cep: '', street: '', number: '', neighborhood: '', city: '', state: '' }
    };
  }, [user, guestId]);

  const conversationsRef = useRef(conversations);
  conversationsRef.current = conversations;

  useEffect(() => {
    return () => {
      Object.values(inactivityTimers).forEach(timer => clearTimeout(timer));
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
    updateConversations(prev => {
      const newConvs = { ...prev };
      const convToClose = newConvs[conversationId];

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
      updateConversations(prev => {
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
      setTimeout(() => closeConversation(conversationId), 3000);
    }, INACTIVITY_TIMEOUT);

    setInactivityTimers(prev => ({ ...prev, [conversationId]: timer }));
  }, [inactivityTimers, closeConversation]);

  const toggleChat = () => {
    if (isChatOpen) {
      setIsChatOpen(false);
      if (currentUser.role === 'receptor') {
        setActiveConversationId(null);
      }
    } else {
      setIsChatOpen(true);
      // Se não for funcionário (é cliente ou visitante), abre a própria conversa
      if (currentUser.userType !== 'funcionario') {
        const convId = currentUser.id;
        setActiveConversationId(convId);
        
        updateConversations(prev => {
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
                clientName: currentUser.name,
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
    updateConversations(prev => {
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
    if (!currentUser || (!text.trim() && !attachment)) return;

    const convId = currentUser.role === 'receptor' ? activeConversationId : currentUser.id;
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
      senderId: currentUser.id,
      senderName: currentUser.name.split(' ')[0],
      text: text,
      timestamp: new Date().toISOString(),
      attachment: attachmentData,
    };

    if (currentUser.userType !== 'funcionario') {
      addNotification(`Nova mensagem no chat de ${currentUser.name}`, { recipientRole: 'receptor' });
    } else {
      addNotification(`Você tem uma nova mensagem de ${currentUser.name}`, { recipientId: convId });
    }

    updateConversations(prev => {
      const existingConv = prev[convId] || {
        id: convId,
        clientName: currentUser.userType !== 'funcionario' ? currentUser.name : (Object.values(prev).find(c => c.id === convId)?.clientName || 'Cliente Desconhecido'),
        messages: [],
        unreadByReceptor: 0,
        unreadByClient: 0,
        lastMessageTimestamp: new Date().toISOString(),
      };

      const updatedMessages = [...existingConv.messages, newMessage];
      let unreadByReceptor = existingConv.unreadByReceptor;
      let unreadByClient = existingConv.unreadByClient;

      if (currentUser.userType !== 'funcionario') {
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

    if (currentUser.userType !== 'funcionario' && !autoReplySent[convId]) {
      setTimeout(() => {
        const autoReply: ChatMessage = {
          id: new Date().toISOString() + 'reply',
          senderId: 'receptor_bot',
          senderName: 'Funcionário',
          text: `Olá, ${currentUser.name.split(' ')[0]}! Recebemos sua mensagem e em breve um de nossos funcionários irá atendê-lo.`,
          timestamp: new Date().toISOString(),
        };
        updateConversations(currentConvs => {
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
  }, [currentUser, activeConversationId, addNotification, autoReplySent, startInactivityTimer]);

  const sortedConversations = useMemo(() => {
    return Object.values(conversations).sort((a, b) => 
      new Date(b.lastMessageTimestamp).getTime() - new Date(a.lastMessageTimestamp).getTime()
    );
  }, [conversations]);
  
  const activeConversation = activeConversationId ? conversations[activeConversationId] : null;

  const totalUnreadCount = useMemo(() => {
    if (!currentUser) return 0;
    if (currentUser.role === 'receptor') {
      return sortedConversations.reduce((acc, c) => acc + c.unreadByReceptor, 0);
    }
    if (currentUser.userType !== 'funcionario' && conversations[currentUser.id]) {
      return conversations[currentUser.id].unreadByClient;
    }
    return 0;
  }, [currentUser, conversations, sortedConversations]);

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
