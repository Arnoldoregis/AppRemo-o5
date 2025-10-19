import React, { createContext, useContext, useState, ReactNode, useRef, useEffect } from 'react';
import { StockItem } from '../types';
import { faker } from '@faker-js/faker';
import { useNotifications } from './NotificationContext';

interface StockContextType {
  stock: StockItem[];
  addProduct: (item: Omit<StockItem, 'id' | 'createdAt' | 'trackingCode'>) => void;
  updateProduct: (id: string, updates: Partial<Omit<StockItem, 'id' | 'createdAt' | 'trackingCode'>>) => void;
  deleteProduct: (id: string) => void;
  deductStockItems: (items: { name: string; quantity: number }[]) => void;
}

const StockContext = createContext<StockContextType | undefined>(undefined);

export const useStock = () => {
  const context = useContext(StockContext);
  if (!context) {
    throw new Error('useStock must be used within a StockProvider');
  }
  return context;
};

const generateMockStock = (): StockItem[] => {
    return [
        { id: 'stock_1', trackingCode: '0001', name: 'Urna Padrão - P', category: 'material_venda', quantity: 10, sellingPrice: 70.00, createdAt: faker.date.past().toISOString(), unitDescription: 'Unidade', minAlertQuantity: 15 },
        { id: 'stock_8', trackingCode: '0002', name: 'Urna Padrão - G', category: 'material_venda', quantity: 5, sellingPrice: 90.00, createdAt: faker.date.past().toISOString(), unitDescription: 'Unidade', minAlertQuantity: 10 },
        { id: 'stock_2', trackingCode: '0003', name: 'Kit Patinha em Resina', category: 'material_venda', quantity: 100, sellingPrice: 150.00, createdAt: faker.date.past().toISOString(), unitDescription: 'Kit', minAlertQuantity: 20 },
        { id: 'stock_3', trackingCode: '0004', name: 'Relicário', category: 'material_venda', quantity: 30, sellingPrice: 200.00, createdAt: faker.date.past().toISOString(), unitDescription: 'Unidade', minAlertQuantity: 5 },
        { id: 'stock_4', trackingCode: '0005', name: 'Papel Sulfite A4', category: 'material_escritorio', quantity: 2, sellingPrice: 0, createdAt: faker.date.past().toISOString(), unitDescription: 'Pacote c/ 500 folhas', minAlertQuantity: 3 },
        { id: 'stock_5', trackingCode: '0006', name: 'Desinfetante', category: 'material_limpeza', quantity: 20, sellingPrice: 0, createdAt: faker.date.past().toISOString(), unitDescription: 'Garrafa 2L', minAlertQuantity: 10 },
        { id: 'stock_6', trackingCode: '0007', name: 'Pingente em Resina', category: 'sob_encomenda', quantity: 0, sellingPrice: 250.00, createdAt: faker.date.past().toISOString() },
        { id: 'stock_7', trackingCode: '0008', name: 'Sacolas para entrega', category: 'material_escritorio', quantity: 1, sellingPrice: 0, createdAt: faker.date.past().toISOString(), unitDescription: 'Caixa c/ 2 lotes de 50', minAlertQuantity: 1 },
    ].sort((a, b) => parseInt(a.trackingCode, 10) - parseInt(b.trackingCode, 10));
};

export const StockProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [stock, setStock] = useState<StockItem[]>([]);
  const lastCodeNumberRef = useRef(0);
  const { addNotification } = useNotifications();
  const notifiedItemsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    const initialStock = generateMockStock();
    const maxCode = initialStock.reduce((max, item) => {
        const codeNum = parseInt(item.trackingCode, 10);
        return codeNum > max ? codeNum : max;
    }, 0);
    lastCodeNumberRef.current = maxCode;
    setStock(initialStock);
  }, []);

  useEffect(() => {
    const checkStockLevels = () => {
      stock.forEach(item => {
        if (item.minAlertQuantity !== undefined && item.quantity <= item.minAlertQuantity) {
          if (!notifiedItemsRef.current.has(item.id)) {
            addNotification(
              `Estoque baixo para "${item.name}". Quantidade atual: ${item.quantity}.`,
              { recipientRole: 'financeiro_master' }
            );
            notifiedItemsRef.current.add(item.id);
          }
        } else {
          if (notifiedItemsRef.current.has(item.id)) {
            notifiedItemsRef.current.delete(item.id);
          }
        }
      });
    };

    // Simula uma verificação diária (aqui, a cada 2 minutos para fins de demonstração)
    const interval = setInterval(checkStockLevels, 2 * 60 * 1000);
    
    // Verificação inicial ao carregar
    checkStockLevels();

    return () => clearInterval(interval);
  }, [stock, addNotification]);

  const generateStockTrackingCode = (): string => {
    lastCodeNumberRef.current += 1;
    return lastCodeNumberRef.current.toString().padStart(4, '0');
  };

  const addProduct = (item: Omit<StockItem, 'id' | 'createdAt' | 'trackingCode'>) => {
    const newProduct: StockItem = {
      ...item,
      id: `stock_${new Date().getTime()}`,
      trackingCode: generateStockTrackingCode(),
      createdAt: new Date().toISOString(),
    };
    setStock(prev => [...prev, newProduct].sort((a, b) => parseInt(a.trackingCode, 10) - parseInt(b.trackingCode, 10)));
  };

  const updateProduct = (id: string, updates: Partial<Omit<StockItem, 'id' | 'createdAt' | 'trackingCode'>>) => {
    setStock(prev => 
      prev.map(item => 
        item.id === id ? { ...item, ...updates } : item
      ).sort((a, b) => parseInt(a.trackingCode, 10) - parseInt(b.trackingCode, 10))
    );
  };

  const deleteProduct = (id: string) => {
    setStock(prev => prev.filter(item => item.id !== id));
  };

  const deductStockItems = (itemsToDeduct: { name: string; quantity: number }[]) => {
    setStock(prevStock => {
        const newStock = [...prevStock];
        itemsToDeduct.forEach(item => {
            const stockIndex = newStock.findIndex(stockItem => stockItem.name === item.name);
            if (stockIndex !== -1) {
                newStock[stockIndex].quantity -= item.quantity;
                if (newStock[stockIndex].quantity < 0) {
                    console.warn(`Estoque para ${item.name} ficou negativo.`);
                    alert(`Atenção: O estoque para o item "${item.name}" está negativo!`);
                }
            } else {
                console.warn(`Item ${item.name} não encontrado no estoque para dedução.`);
            }
        });
        return newStock;
    });
  };

  const value = {
    stock,
    addProduct,
    updateProduct,
    deleteProduct,
    deductStockItems,
  };

  return <StockContext.Provider value={value}>{children}</StockContext.Provider>;
};
