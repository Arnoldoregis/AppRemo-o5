import React from 'react';
import { MessageSquare } from 'lucide-react';
import { useChat } from '../context/ChatContext';

const ChatWidget: React.FC = () => {
  const { toggleChat, totalUnreadCount } = useChat();

  return (
    <button
      onClick={toggleChat}
      className="fixed bottom-8 right-8 bg-blue-600 text-white p-4 rounded-full shadow-lg hover:bg-blue-700 transition-transform hover:scale-110 z-40"
      aria-label="Abrir chat"
    >
      <MessageSquare size={24} />
      {totalUnreadCount > 0 && (
        <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white">
          {totalUnreadCount}
        </span>
      )}
    </button>
  );
};

export default ChatWidget;
