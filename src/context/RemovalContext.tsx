import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { Removal, RemovalStatus, CremationBatch, CremationBatchItem } from '../types';
import { generateMockRemovals } from '../data/mock';
import { differenceInMinutes, parse, isBefore } from 'date-fns';
import { useNotifications } from './NotificationContext';
import { v4 as uuidv4 } from 'uuid';
import { generateRemovalCode, generateContractNumber, generatePreventiveContractCode } from '../utils/codeGenerator';

interface RemovalContextType {
  removals: Removal[];
  addRemoval: (removal: Partial<Removal>) => Removal;
  updateRemoval: (id: string, updates: Partial<Removal>) => void;
  updateMultipleRemovals: (codes: string[], updates: Partial<Removal>, firstRemoval: Removal) => void;
  getRemovalsByStatus: (status: RemovalStatus) => Removal[];
  getRemovalsByOwner: (ownerId: string) => Removal[];
  cremationBatches: CremationBatch[];
  createCremationBatch: (items: CremationBatchItem[], operatorName: string) => void;
  startCremationBatch: (batchId: string, operatorName: string) => void;
  finishCremationBatch: (batchId: string, operatorName: string) => void;
  driverReturningToHQ: boolean;
  setDriverReturningToHQ: (isReturning: boolean) => void;
}

const RemovalContext = createContext<RemovalContextType | undefined>(undefined);

export const useRemovals = () => {
  const context = useContext(RemovalContext);
  if (context === undefined) {
    throw new Error('useRemovals must be used within a RemovalProvider');
  }
  return context;
};

interface RemovalProviderProps {
  children: ReactNode;
}

export const RemovalProvider: React.FC<RemovalProviderProps> = ({ children }) => {
  const [removals, setRemovals] = useState<Removal[]>([]);
  const [cremationBatches, setCremationBatches] = useState<CremationBatch[]>([]);
  const [driverReturningToHQ, setDriverReturningToHQ] = useState(false);
  const { addNotification } = useNotifications();
  
  useEffect(() => {
    const mockDataWithIds = generateMockRemovals().map(r => ({
        ...r,
        id: r.id || uuidv4(),
    }));
    setRemovals(mockDataWithIds);
  }, []);

  // Efeito para verificar agendamentos
  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      removals.forEach(r => {
        if (r.status === 'agendada' && r.scheduledDate && r.scheduledTime) {
          try {
            const scheduledDateTime = parse(`${r.scheduledDate} ${r.scheduledTime}`, 'yyyy-MM-dd HH:mm', new Date());
            
            if (isBefore(scheduledDateTime, now) && differenceInMinutes(now, scheduledDateTime) <= 10) {
              updateRemoval(r.id, {
                status: 'solicitada',
                history: [
                  ...r.history,
                  {
                    date: new Date().toISOString(),
                    action: 'Status alterado automaticamente de Agendada para Solicitada',
                    user: 'Sistema',
                  },
                ],
              });
               addNotification(`Agendamento ${r.code} virou uma solicitação.`, { recipientRole: 'receptor' });
            }
          } catch (error) {
            console.error("Erro ao parsear data/hora do agendamento:", error);
          }
        }
      });
    }, 60000); // Verifica a cada minuto

    return () => clearInterval(interval); // Limpa o intervalo ao desmontar
  }, [removals]);


  const addRemoval = (removalData: Partial<Removal>): Removal => {
    const isPreventive = removalData.modality === 'plano_preventivo';

    const newCode = isPreventive 
        ? generatePreventiveContractCode(removals) 
        : generateRemovalCode(removals);
        
    const newContractNumber = generateContractNumber(removals);

    const newRemoval: Removal = {
      id: uuidv4(),
      code: newCode,
      contractNumber: newContractNumber,
      createdAt: new Date().toISOString(),
      // Default values for required fields
      createdById: '',
      modality: '',
      tutor: { cpfOrCnpj: '', name: '', phone: '', email: '' },
      pet: { name: '', species: '', breed: '', gender: '', weight: '', causeOfDeath: '' },
      removalAddress: { cep: '', street: '', number: '', neighborhood: '', city: '', state: '' },
      additionals: [],
      paymentMethod: '',
      value: 0,
      observations: '',
      requestType: 'agora',
      status: 'solicitada',
      history: [],
      ...removalData,
    };

    newRemoval.history = newRemoval.history || [];
    if (!newRemoval.history.some(h => h.action.includes('criada'))) {
        newRemoval.history.unshift({
            date: newRemoval.createdAt,
            action: `Solicitação criada por ${removalData.history?.[0]?.user || 'Sistema'}`,
            user: removalData.history?.[0]?.user || 'Sistema'
        });
    }

    setRemovals(prev => [newRemoval, ...prev]);
    addNotification(`Nova remoção ${newCode} recebida.`, { recipientRole: 'receptor' });
    return newRemoval;
  };

  const updateRemoval = (id: string, updates: Partial<Removal>) => {
    let originalRemoval: Removal | undefined;
    setRemovals(prev =>
      prev.map(removal => {
        if (removal.id === id) {
          originalRemoval = removal;
          return { ...removal, ...updates };
        }
        return removal;
      })
    );
    
    if (originalRemoval && updates.code && !originalRemoval.code) {
        addNotification(`Código ${updates.code} definido para a remoção.`, { recipientRole: 'receptor' });
        addNotification(`Código ${updates.code} definido para a remoção.`, { recipientRole: 'motorista' });
        addNotification(`Código ${updates.code} definido para a remoção.`, { recipientRole: 'financeiro_junior' });
    }

    if (originalRemoval && updates.status) {
      switch(updates.status) {
        case 'em_andamento':
          if (updates.assignedDriver) {
            addNotification(`Nova remoção encaminhada a você: ${originalRemoval.code || id}.`, { recipientId: updates.assignedDriver.id });
          }
          break;
        case 'a_caminho':
          addNotification(`O motorista está a caminho da sua solicitação ${originalRemoval.code || id}.`, { recipientId: originalRemoval.createdById });
          break;
        case 'concluida':
          addNotification(`Remoção ${originalRemoval.code || id} está pronta para análise operacional.`, { recipientRole: 'operacional' });
          break;
        case 'aguardando_financeiro_junior':
          addNotification(`Remoção ${originalRemoval.code || id} aguardando análise financeira.`, { recipientRole: 'financeiro_junior' });
          break;
      }
    }
  };

  const updateMultipleRemovals = (codes: string[], updates: Partial<Removal>, firstRemoval: Removal) => {
    setRemovals(prev =>
      prev.map(removal => {
        if (codes.includes(removal.code)) {
          const newHistoryEntry = updates.history ? updates.history[updates.history.length - 1] : null;
          const updatesWithoutHistory = { ...updates };
          delete updatesWithoutHistory.history;
          
          const finalUpdates = { ...removal, ...updatesWithoutHistory };
          if (newHistoryEntry) {
              finalUpdates.history = [...removal.history, newHistoryEntry];
          }
          return finalUpdates;
        }
        return removal;
      })
    );

    if (updates.status) {
      switch(updates.status) {
        case 'aguardando_boleto':
          addNotification(`Boleto de faturamento mensal recebido.`, { recipientId: firstRemoval.createdById });
          break;
        case 'pagamento_concluido':
          addNotification(`Comprovante de pagamento da Clínica ${firstRemoval.clinicName} recebido.`, { recipientRole: 'financeiro_master' });
          break;
      }
    }
  };

  const getRemovalsByStatus = (status: RemovalStatus): Removal[] => {
    return removals.filter(removal => removal.status === status);
  };
  
  const getRemovalsByOwner = (ownerId: string): Removal[] => {
    return removals.filter(removal => removal.createdById === ownerId);
  };

  const createCremationBatch = (items: CremationBatchItem[], operatorName: string) => {
    const newBatch: CremationBatch = {
      id: `LOTE-${new Date().getTime()}`,
      createdAt: new Date().toISOString(),
      items: items,
    };
    setCremationBatches(prev => [newBatch, ...prev]);

    const removalCodes = items.map(item => item.removalCode);
    const historyEntry = {
        date: new Date().toISOString(),
        action: `Adicionado ao lote de cremação ${newBatch.id} pelo operador ${operatorName.split(' ')[0]}`,
        user: operatorName,
    };

    setRemovals(prevRemovals => 
      prevRemovals.map(r => 
        removalCodes.includes(r.code) ? { ...r, status: 'em_lote_cremacao', history: [...r.history, historyEntry] } : r
      )
    );
    addNotification(`Novo lote de cremação ${newBatch.id} foi criado.`, { recipientRole: 'operacional' });
  };

  const startCremationBatch = (batchId: string, operatorName: string) => {
    let removalCodesToUpdate: string[] = [];
    setCremationBatches(prev => 
      prev.map(batch => {
        if (batch.id === batchId) {
            removalCodesToUpdate = batch.items.map(item => item.removalCode);
            return { ...batch, startedAt: new Date().toISOString() };
        }
        return batch;
      })
    );

    if (removalCodesToUpdate.length > 0) {
        const historyEntry = {
            date: new Date().toISOString(),
            action: `Cremação do lote ${batchId} iniciada pelo operador ${operatorName.split(' ')[0]}`,
            user: operatorName,
        };
        setRemovals(prevRemovals =>
            prevRemovals.map(r =>
                removalCodesToUpdate.includes(r.code) ? { ...r, history: [...r.history, historyEntry] } : r
            )
        );
    }
  };

  const finishCremationBatch = (batchId: string, operatorName: string) => {
    let removalCodesToUpdate: string[] = [];

    setCremationBatches(prevBatches => 
      prevBatches.map(batch => {
        if (batch.id === batchId) {
          removalCodesToUpdate = batch.items.map(item => item.removalCode);
          return { ...batch, finishedAt: new Date().toISOString() };
        }
        return batch;
      })
    );

    if (removalCodesToUpdate.length > 0) {
        const historyEntry = {
            date: new Date().toISOString(),
            action: `Pet cremado no lote ${batchId} pelo operador ${operatorName.split(' ')[0]}`,
            user: operatorName,
        };
        setRemovals(prevRemovals => 
          prevRemovals.map(r => 
            removalCodesToUpdate.includes(r.code) ? { ...r, status: 'cremado', history: [...r.history, historyEntry] } : r
          )
        );
    }
    addNotification(`O lote de cremação ${batchId} foi finalizado.`, { recipientRole: 'operacional' });
  };

  const value = {
    removals,
    addRemoval,
    updateRemoval,
    updateMultipleRemovals,
    getRemovalsByStatus,
    getRemovalsByOwner,
    cremationBatches,
    createCremationBatch,
    startCremationBatch,
    finishCremationBatch,
    driverReturningToHQ,
    setDriverReturningToHQ,
  };

  return <RemovalContext.Provider value={value}>{children}</RemovalContext.Provider>;
};
