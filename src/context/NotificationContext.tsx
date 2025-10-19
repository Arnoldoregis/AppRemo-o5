import React, { createContext, useContext, useState, ReactNode, useMemo } from 'react';
import { useAuth } from './AuthContext';

interface Notification {
  id: string;
  message: string;
  read: boolean;
  date: string;
  recipient: {
    id?: string;
    role?: string;
  };
}

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  addNotification: (message: string, recipient: { recipientId?: string; recipientRole?: string }) => void;
  markAllAsRead: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

export const NotificationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [allNotifications, setAllNotifications] = useState<Notification[]>([]);
  const { user } = useAuth();

  const addNotification = (message: string, { recipientId, recipientRole }: { recipientId?: string; recipientRole?: string }) => {
    const newNotification: Notification = {
      id: new Date().toISOString() + Math.random(),
      message,
      read: false,
      date: new Date().toISOString(),
      recipient: {
        id: recipientId,
        role: recipientRole,
      },
    };
    setAllNotifications(prev => [newNotification, ...prev]);
  };

  const userNotifications = useMemo(() => {
    if (!user) return [];
    return allNotifications.filter(n => {
      // Notificação para um usuário específico
      if (n.recipient.id && n.recipient.id === user.id) {
        return true;
      }
      // Notificação para uma função específica (ex: todos os receptores)
      if (n.recipient.role && n.recipient.role === user.role) {
        return true;
      }
      return false;
    }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [allNotifications, user]);

  const unreadCount = useMemo(() => {
    return userNotifications.filter(n => !n.read).length;
  }, [userNotifications]);

  const markAllAsRead = () => {
    if (!user) return;
    setAllNotifications(prev =>
      prev.map(n => {
        const isForUser = (n.recipient.id && n.recipient.id === user.id) || (n.recipient.role && n.recipient.role === user.role);
        if (isForUser) {
          return { ...n, read: true };
        }
        return n;
      })
    );
  };

  const value = {
    notifications: userNotifications,
    unreadCount,
    addNotification,
    markAllAsRead,
  };

  return <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>;
};
