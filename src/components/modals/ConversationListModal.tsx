import React from 'react';
import { useChat } from '../../context/ChatContext';
import { useAuth } from '../../context/AuthContext';
import { Minus, MessageSquare, X } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const ConversationListModal: React.FC = () => {
  const { conversations, openConversation, toggleChat, isChatOpen, activeConversation } = useChat();
  const { user } = useAuth();

  // This modal should ONLY be visible for receptors, and only when no specific conversation is active.
  if (!isChatOpen || activeConversation || user?.role !== 'receptor') {
    return null;
  }

  return (
    <div className="fixed bottom-24 right-8 w-96 h-[60vh] bg-white rounded-lg shadow-2xl flex flex-col z-50">
      <div className="bg-blue-600 text-white p-4 rounded-t-lg flex justify-between items-center">
        <h3 className="font-semibold text-lg">Conversas Ativas</h3>
        <div className="flex items-center gap-3">
            <button onClick={toggleChat} className="text-blue-200 hover:text-white" title="Minimizar">
              <Minus size={20} />
            </button>
            <button onClick={toggleChat} className="text-blue-200 hover:text-white" title="Fechar">
              <X size={20} />
            </button>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto">
        {conversations.length > 0 ? (
          conversations.map(conv => (
            <div
              key={conv.id}
              onClick={() => openConversation(conv.id)}
              className="p-4 border-b hover:bg-gray-100 cursor-pointer flex justify-between items-center"
            >
              <div>
                <p className="font-semibold text-gray-800">{conv.clientName}</p>
                <p className="text-xs text-gray-500">
                  Última msg: {formatDistanceToNow(new Date(conv.lastMessageTimestamp), { addSuffix: true, locale: ptBR })}
                </p>
              </div>
              {conv.unreadByReceptor > 0 && (
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white">
                  {conv.unreadByReceptor}
                </span>
              )}
            </div>
          ))
        ) : (
          <div className="p-8 text-center text-gray-500 flex flex-col items-center justify-center h-full">
            <MessageSquare size={48} className="text-gray-300 mb-4" />
            <p>Nenhuma conversa ativa no momento.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ConversationListModal;
