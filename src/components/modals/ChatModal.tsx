import React, { useState, useRef, useEffect } from 'react';
import { useChat } from '../../context/ChatContext';
import { useAuth } from '../../context/AuthContext';
import { Minus, Send, ArrowLeft, X, Paperclip, Download } from 'lucide-react';
import { format } from 'date-fns';
import { downloadFile } from '../../utils/downloadFile';

const ChatModal: React.FC = () => {
  const { isChatOpen, activeConversation, sendMessage, toggleChat, backToList, closeConversation } = useChat();
  const { user } = useAuth();
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(scrollToBottom, [activeConversation?.messages]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (newMessage.trim() || fileInputRef.current?.files?.length) {
      const file = fileInputRef.current?.files?.[0];
      sendMessage(newMessage, file);
      setNewMessage('');
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleAttachmentClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      sendMessage('', file);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  if (!isChatOpen || !activeConversation) return null;

  return (
    <div className="fixed bottom-24 right-8 w-96 h-[60vh] bg-white rounded-lg shadow-2xl flex flex-col z-50">
      {/* Header */}
      <div className="bg-blue-600 text-white p-4 rounded-t-lg flex justify-between items-center">
        <div className="flex items-center gap-2">
          {user?.role === 'receptor' && (
            <button onClick={backToList} className="text-blue-200 hover:text-white" title="Voltar para a lista">
              <ArrowLeft size={20} />
            </button>
          )}
          <h3 className="font-semibold text-lg">{activeConversation.clientName}</h3>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={toggleChat} className="text-blue-200 hover:text-white" title="Minimizar">
            <Minus size={20} />
          </button>
          <button onClick={() => closeConversation(activeConversation.id)} className="text-blue-200 hover:text-white" title="Fechar conversa">
            <X size={20} />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 p-4 overflow-y-auto bg-gray-50">
        <div className="space-y-4">
          {activeConversation.messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex flex-col ${msg.senderId === user?.id ? 'items-end' : 'items-start'}`}
            >
              <div
                className={`max-w-xs rounded-lg px-3 py-2 ${
                  msg.senderId === user?.id
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-200 text-gray-800'
                } ${msg.senderId === 'system' ? 'bg-yellow-100 text-yellow-800 w-full text-center' : ''}`}
              >
                {msg.text && <p className="text-sm">{msg.text}</p>}
                {msg.attachment && (
                  <div className={`mt-2 ${!msg.text ? '-mt-0' : ''}`}>
                    <img src={msg.attachment.url} alt={msg.attachment.name} className="max-w-full h-auto rounded-md border-2 border-gray-300" />
                    <button 
                      onClick={() => downloadFile(msg.attachment!.url, msg.attachment!.name)}
                      className={`text-xs mt-2 flex items-center gap-1.5 p-1 rounded-md transition-colors ${
                        msg.senderId === user?.id
                          ? 'bg-blue-600 hover:bg-blue-700 text-white'
                          : 'bg-gray-300 hover:bg-gray-400 text-black'
                      }`}
                    >
                      <Download size={14} />
                      Baixar {msg.attachment.name}
                    </button>
                  </div>
                )}
              </div>
              <span className="text-xs text-gray-400 mt-1">
                {msg.senderName} - {format(new Date(msg.timestamp), 'HH:mm')}
              </span>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input Form */}
      <div className="p-4 border-t bg-white">
        <form onSubmit={handleSendMessage} className="flex items-center gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/gif"
            onChange={handleFileChange}
            className="hidden"
          />
          <button
            type="button"
            onClick={handleAttachmentClick}
            className="p-2 text-gray-500 hover:text-blue-600"
            title="Anexar imagem"
          >
            <Paperclip size={20} />
          </button>
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Digite sua mensagem..."
            className="flex-1 px-3 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500"
            autoFocus
          />
          <button
            type="submit"
            className="bg-blue-600 text-white p-3 rounded-full hover:bg-blue-700 disabled:opacity-50"
            disabled={!newMessage.trim()}
          >
            <Send size={18} />
          </button>
        </form>
      </div>
    </div>
  );
};

export default ChatModal;
