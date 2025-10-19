import React, { createContext, useContext, useState, ReactNode, useCallback, useEffect } from 'react';
import { Removal, FarewellSchedule } from '../types';
import { useRemovals } from './RemovalContext';
import { useNotifications } from './NotificationContext';
import { useAuth } from './AuthContext';
import { parse, addMinutes, isAfter } from 'date-fns';

interface AgendaContextType {
  schedule: FarewellSchedule;
  dirtySlots: Set<string>;
  scheduleFarewell: (slotKey: string, removal: Removal) => void;
  removeFarewell: (slotKey: string) => void;
  saveScheduledChanges: () => void;
}

const AgendaContext = createContext<AgendaContextType | undefined>(undefined);

export const useAgenda = () => {
  const context = useContext(AgendaContext);
  if (!context) {
    throw new Error('useAgenda must be used within an AgendaProvider');
  }
  return context;
};

export const AgendaProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [schedule, setSchedule] = useState<FarewellSchedule>({});
  const [dirtySlots, setDirtySlots] = useState<Set<string>>(new Set());
  const { updateRemoval } = useRemovals();
  const { addNotification } = useNotifications();
  const { user } = useAuth();

  const scheduleFarewell = useCallback((slotKey: string, removal: Removal) => {
    setSchedule(prev => ({
      ...prev,
      [slotKey]: removal,
    }));
    setDirtySlots(prev => new Set(prev).add(slotKey));
  }, []);

  const removeFarewell = useCallback((slotKey: string) => {
    setSchedule(prev => {
      const newSchedule = { ...prev };
      delete newSchedule[slotKey];
      return newSchedule;
    });
    setDirtySlots(prev => {
        const newDirty = new Set(prev);
        newDirty.delete(slotKey);
        return newDirty;
    });
  }, []);

  const saveScheduledChanges = useCallback(() => {
    if (!user) return;
    const userName = user.name.split(' ')[0];

    dirtySlots.forEach(slotKey => {
      const removal = schedule[slotKey];
      if (removal && removal.status === 'aguardando_financeiro_junior') {
        updateRemoval(removal.code, {
          status: 'aguardando_baixa_master',
          history: [
            ...removal.history,
            {
              date: new Date().toISOString(),
              action: `Despedida agendada por ${userName}. Encaminhado para o Operacional.`,
              user: user.name,
            },
          ],
        });
        addNotification(
          `Despedida para a remoção ${removal.code} foi agendada.`,
          { recipientRole: 'operacional' }
        );
      }
    });

    setDirtySlots(new Set());
    alert('Alterações salvas com sucesso!');
  }, [dirtySlots, schedule, updateRemoval, addNotification, user]);

  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      const slotsToRemove: string[] = [];
      const removalsToUpdate: Removal[] = [];

      Object.entries(schedule).forEach(([slotKey, removal]) => {
        const timePart = slotKey.split('-')[3];
        if (!timePart || timePart === 'ENCAIXE EMERGÊNCIA') return;
        try {
          const scheduledDateTime = parse(slotKey, 'yyyy-MM-dd-HH:mm', new Date());
          const releaseTime = addMinutes(scheduledDateTime, 30);
          if (isAfter(now, releaseTime)) {
            slotsToRemove.push(slotKey);
            removalsToUpdate.push(removal);
          }
        } catch (error) {
          console.error(`Error processing schedule slot ${slotKey}:`, error);
        }
      });

      if (slotsToRemove.length > 0) {
        removalsToUpdate.forEach(removal => {
          updateRemoval(removal.code, {
            history: [
              ...removal.history,
              {
                date: new Date().toISOString(),
                action: 'Despedida finalizada. Retornado para a fila de liberação de cremação.',
                user: 'Sistema',
              },
            ],
          });
          addNotification(
            `Despedida da remoção ${removal.code} finalizada. Aguardando liberação para cremação.`,
            { recipientRole: 'operacional' }
          );
        });

        setSchedule(prevSchedule => {
          const newSchedule = { ...prevSchedule };
          slotsToRemove.forEach(key => {
            delete newSchedule[key];
          });
          return newSchedule;
        });
      }
    }, 60 * 1000);

    return () => clearInterval(interval);
  }, [schedule, updateRemoval, addNotification]);

  const value = {
    schedule,
    dirtySlots,
    scheduleFarewell,
    removeFarewell,
    saveScheduledChanges,
  };

  return <AgendaContext.Provider value={value}>{children}</AgendaContext.Provider>;
};
