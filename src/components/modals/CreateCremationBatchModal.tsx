import React, { useState, useMemo } from 'react';
import { useRemovals } from '../../context/RemovalContext';
import { X, PlusCircle, Trash2 } from 'lucide-react';
import { CremationBatchItem, CremationPosition, Removal } from '../../types';

interface CreateCremationBatchModalProps {
    onClose: () => void;
    operatorName: string;
}

const CreateCremationBatchModal: React.FC<CreateCremationBatchModalProps> = ({ onClose, operatorName }) => {
    const { removals, createCremationBatch } = useRemovals();
    const [selectedItems, setSelectedItems] = useState<CremationBatchItem[]>([]);

    const availableRemovals = useMemo(() => {
        const selectedCodes = selectedItems.map(item => item.removalCode);
        return removals.filter(r => 
            r.status === 'finalizada' && 
            r.modality.includes('individual') &&
            !selectedCodes.includes(r.code)
        );
    }, [removals, selectedItems]);

    const handleSelectRemoval = (removal: Removal) => {
        if (selectedItems.length >= 4) {
            alert('Um lote de cremação pode ter no máximo 4 remoções.');
            return;
        }
        const newItem: CremationBatchItem = {
            removalCode: removal.code,
            petName: removal.pet.name,
            weight: removal.realWeight || 0,
            position: 'frente', // default position
        };
        setSelectedItems(prev => [...prev, newItem]);
    };

    const handleRemoveItem = (removalCode: string) => {
        setSelectedItems(prev => prev.filter(item => item.removalCode !== removalCode));
    };

    const handlePositionChange = (removalCode: string, position: CremationPosition) => {
        setSelectedItems(prev => prev.map(item => 
            item.removalCode === removalCode ? { ...item, position } : item
        ));
    };

    const handleCreateBatch = () => {
        if (selectedItems.length === 0) {
            alert('Selecione pelo menos uma remoção para criar o lote.');
            return;
        }
        createCremationBatch(selectedItems, operatorName);
        onClose();
    };

    const positions: CremationPosition[] = ['frente', 'meio/frente', 'meio', 'meio/fundo', 'fundo'];

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] flex flex-col">
                <div className="sticky top-0 bg-white p-4 border-b flex justify-between items-center z-10">
                    <h2 className="text-xl font-bold text-gray-900">Criar Novo Lote de Cremação</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X className="h-6 w-6" /></button>
                </div>

                <div className="flex-grow overflow-y-auto p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Lista de Disponíveis */}
                    <div className="space-y-2">
                        <h3 className="font-semibold text-lg">Remoções Aguardando Cremação</h3>
                        <div className="border rounded-lg max-h-96 overflow-y-auto">
                            {availableRemovals.length > 0 ? (
                                <ul className="divide-y">
                                    {availableRemovals.map(removal => (
                                        <li key={removal.code} className="p-3 flex justify-between items-center hover:bg-gray-50">
                                            <div>
                                                <p className="font-semibold">{removal.pet.name} <span className="text-gray-500">({removal.code})</span></p>
                                                <p className="text-sm text-gray-600">Tutor: {removal.tutor.name}</p>
                                            </div>
                                            <button onClick={() => handleSelectRemoval(removal)} className="text-blue-600 hover:text-blue-800" title="Adicionar ao lote">
                                                <PlusCircle size={20} />
                                            </button>
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <p className="p-4 text-center text-gray-500">Nenhuma remoção disponível para cremação.</p>
                            )}
                        </div>
                    </div>

                    {/* Lista de Selecionados */}
                    <div className="space-y-4">
                        <h3 className="font-semibold text-lg">Lote Atual ({selectedItems.length}/4)</h3>
                        {selectedItems.length > 0 ? (
                            <div className="space-y-3">
                                {selectedItems.map(item => (
                                    <div key={item.removalCode} className="p-3 bg-gray-50 border rounded-lg">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <p className="font-semibold">{item.petName} <span className="text-gray-500">({item.removalCode})</span></p>
                                                <p className="text-sm text-gray-600">Peso: {item.weight.toFixed(2)} kg</p>
                                            </div>
                                            <button onClick={() => handleRemoveItem(item.removalCode)} className="text-red-500 hover:text-red-700"><Trash2 size={18} /></button>
                                        </div>
                                        <div className="mt-2">
                                            <label className="text-xs font-medium">Posição no Forno</label>
                                            <select 
                                                value={item.position} 
                                                onChange={(e) => handlePositionChange(item.removalCode, e.target.value as CremationPosition)}
                                                className="w-full mt-1 p-1.5 border rounded-md text-sm"
                                            >
                                                {positions.map(pos => <option key={pos} value={pos}>{pos.replace(/\//g, ' / ').replace(/\b\w/g, l => l.toUpperCase())}</option>)}
                                            </select>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-gray-500 text-sm">Selecione remoções da lista ao lado para adicionar ao lote.</p>
                        )}
                    </div>
                </div>

                <div className="sticky bottom-0 bg-gray-50 p-4 border-t flex justify-end items-center gap-4">
                    <button onClick={onClose} className="px-6 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700">Cancelar</button>
                    <button onClick={handleCreateBatch} disabled={selectedItems.length === 0} className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50">Criar Lote</button>
                </div>
            </div>
        </div>
    );
};

export default CreateCremationBatchModal;
