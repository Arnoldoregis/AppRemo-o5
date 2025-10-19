import React, { useState, useEffect } from 'react';
import { Removal, CustomAdditional } from '../types';
import { useRemovals } from '../context/RemovalContext';
import { useAuth } from '../context/AuthContext';
import { CheckCircle, Edit, Upload, Plus, Trash2, Save } from 'lucide-react';

interface FinanceiroJuniorActionsProps {
  removal: Removal;
  onClose: () => void;
}

const FinanceiroJuniorActions: React.FC<FinanceiroJuniorActionsProps> = ({ removal, onClose }) => {
  const { updateRemoval } = useRemovals();
  const { user } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  
  // State for the form
  const [newItems, setNewItems] = useState<CustomAdditional[]>([]);
  const [productName, setProductName] = useState('');
  const [productValue, setProductValue] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewTotal, setPreviewTotal] = useState(removal.value);

  useEffect(() => {
    const newItemsTotal = newItems.reduce((acc, item) => acc + item.value, 0);
    setPreviewTotal(removal.value + newItemsTotal);
  }, [newItems, removal.value]);


  const handleFinalizeForMaster = () => {
    if (!user) return;

    updateRemoval(removal.code, {
      status: 'aguardando_baixa_master',
      history: [
        ...removal.history,
        {
          date: new Date().toISOString(),
          action: `Financeiro Junior ${user.name.split(' ')[0]} finalizou e enviou para o Financeiro Master`,
          user: user.name,
        },
      ],
    });
    onClose();
  };

  const handleAddItem = () => {
      if (productName && productValue && newItems.length < 10) {
          const newItem: CustomAdditional = {
              id: new Date().toISOString(),
              name: productName,
              value: parseFloat(productValue),
              paymentProof: selectedFile ? selectedFile.name : undefined,
          };
          setNewItems([...newItems, newItem]);
          setProductName('');
          setProductValue('');
          setSelectedFile(null);
          // Limpa o input de arquivo visualmente
          const fileInput = document.getElementById('custom-product-file-input') as HTMLInputElement;
          if (fileInput) fileInput.value = '';
      }
  };

  const handleRemoveItem = (id: string) => {
      setNewItems(newItems.filter(item => item.id !== id));
  };

  const handleSave = () => {
      if (!user) return;

      const existingCustomAdditionals = removal.customAdditionals || [];
      const updatedCustomAdditionals = [...existingCustomAdditionals, ...newItems];

      const newValue = removal.value + newItems.reduce((acc, item) => acc + item.value, 0);
      
      const itemsSummary = newItems.map(item => `${item.name} (R$ ${item.value.toFixed(2)})`).join(', ');

      updateRemoval(removal.code, {
          customAdditionals: updatedCustomAdditionals,
          value: newValue,
          history: [
              ...removal.history,
              {
                  date: new Date().toISOString(),
                  action: `Financeiro Junior ${user.name.split(' ')[0]} adicionou: ${itemsSummary}.`,
                  user: user.name,
              },
          ],
      });
      
      setIsEditing(false);
      setNewItems([]);
  };

  if (removal.status !== 'concluida') {
    return null;
  }

  if (isEditing) {
      return (
          <div className="w-full space-y-4">
              <h4 className="font-semibold text-gray-800">Adicionar Produtos/Serviços</h4>
              <div className="space-y-3 p-3 bg-gray-50 rounded-md border">
                <div className="flex gap-2 items-end">
                    <div className="flex-grow">
                        <label className="text-xs font-medium text-gray-600">Produto</label>
                        <input type="text" value={productName} onChange={e => setProductName(e.target.value)} placeholder="Nome do produto" className="w-full px-2 py-1 border rounded-md text-sm" />
                    </div>
                    <div className="w-24">
                        <label className="text-xs font-medium text-gray-600">Valor (R$)</label>
                        <input type="number" value={productValue} onChange={e => setProductValue(e.target.value)} placeholder="Valor" className="w-full px-2 py-1 border rounded-md text-sm" />
                    </div>
                </div>
                
                <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                        <Upload className="inline h-4 w-4 mr-1" />
                        Anexar Comprovante (opcional)
                    </label>
                    <input
                        id="custom-product-file-input"
                        type="file"
                        accept=".jpg,.jpeg,.pdf"
                        onChange={e => setSelectedFile(e.target.files ? e.target.files[0] : null)}
                        className="w-full text-sm text-gray-500 file:mr-4 file:py-1 file:px-2 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                    />
                </div>

                <button onClick={handleAddItem} disabled={newItems.length >= 10 || !productName || !productValue} className="w-full px-3 py-1.5 bg-blue-500 text-white rounded-md text-sm flex items-center justify-center gap-1 disabled:opacity-50">
                    <Plus size={16} /> Adicionar Item à Lista
                </button>
              </div>

              {newItems.length > 0 && (
                  <div className="space-y-2 mt-2">
                      <p className="text-sm font-medium">Itens a serem adicionados:</p>
                      <ul className="list-disc list-inside text-sm bg-gray-100 p-3 rounded-md border">
                          {newItems.map(item => (
                              <li key={item.id} className="flex justify-between items-center py-1">
                                  <span>{item.name} - R$ {item.value.toFixed(2)} {item.paymentProof && `(${item.paymentProof})`}</span>
                                  <button onClick={() => handleRemoveItem(item.id)} className="text-red-500 hover:text-red-700"><Trash2 size={14} /></button>
                              </li>
                          ))}
                      </ul>
                      <p className="text-right font-semibold text-blue-600">Novo Valor Total (Prévia): R$ {previewTotal.toFixed(2)}</p>
                  </div>
              )}

              <div className="flex justify-end gap-2 pt-2">
                  <button onClick={() => setIsEditing(false)} className="px-4 py-2 bg-gray-300 text-gray-800 rounded-md text-sm">Cancelar</button>
                  <button onClick={handleSave} disabled={newItems.length === 0} className="px-4 py-2 bg-green-600 text-white rounded-md text-sm flex items-center gap-1 disabled:opacity-50">
                      <Save size={14} /> Salvar Alterações
                  </button>
              </div>
          </div>
      );
  }

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={() => setIsEditing(true)}
        className="px-4 py-2 bg-yellow-500 text-white rounded-md hover:bg-yellow-600 flex items-center gap-2"
      >
        <Edit size={16} /> Adicionar/Editar Produtos
      </button>
      <button
        onClick={handleFinalizeForMaster}
        className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 flex items-center gap-2"
      >
        <CheckCircle size={16} /> Finalizar para Master
      </button>
    </div>
  );
};

export default FinanceiroJuniorActions;
