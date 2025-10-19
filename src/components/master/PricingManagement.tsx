import React, { useState, useMemo } from 'react';
import { usePricing } from '../../context/PricingContext';
import { Edit, Save, X, Plus, Trash2, Eye, EyeOff, ClipboardEdit } from 'lucide-react';
import AddWeightRangeModal from '../modals/AddWeightRangeModal';
import EditPriceRangeModal from '../modals/EditPriceRangeModal';
import { PriceRegion, PetSpeciesType, BillingType } from '../../types';

const regionLabels: Record<PriceRegion, string> = {
    curitiba_rm: 'Curitiba/RM',
    litoral: 'Litoral',
    sc: 'SC',
};

const speciesLabels: Record<PetSpeciesType, string> = {
    normal: 'Não Exótico',
    exotico: 'Exótico',
};

const billingLabels: Record<BillingType, string> = {
    nao_faturado: 'Não Faturado',
    faturado: 'Faturado',
};

export interface FlatPriceRow {
    id: string;
    region: PriceRegion;
    speciesType: PetSpeciesType;
    billingType: BillingType;
    weightRange: string;
    prices: Record<string, number>;
}

interface EditingCell {
    rowId: string;
    modalityKey: string;
}

const PricingManagement: React.FC = () => {
    const { priceTable, modalities, updatePrice, toggleModalityStatus, removeWeightRange } = usePricing();
    const [editingCell, setEditingCell] = useState<EditingCell | null>(null);
    const [editValue, setEditValue] = useState('');
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [editingRow, setEditingRow] = useState<FlatPriceRow | null>(null);

    const flatPriceData = useMemo((): FlatPriceRow[] => {
        const data: FlatPriceRow[] = [];
        for (const region in priceTable) {
            for (const speciesType in priceTable[region as PriceRegion]) {
                for (const billingType in priceTable[region as PriceRegion][speciesType as PetSpeciesType]) {
                    for (const weightRange in priceTable[region as PriceRegion][speciesType as PetSpeciesType][billingType as BillingType]) {
                        const id = `${region}-${speciesType}-${billingType}-${weightRange}`;
                        data.push({
                            id,
                            region: region as PriceRegion,
                            speciesType: speciesType as PetSpeciesType,
                            billingType: billingType as BillingType,
                            weightRange,
                            prices: priceTable[region as PriceRegion][speciesType as PetSpeciesType][billingType as BillingType][weightRange],
                        });
                    }
                }
            }
        }
        return data;
    }, [priceTable]);

    const handleEditClick = (row: FlatPriceRow, modKey: string, currentValue: number) => {
        setEditingCell({ rowId: row.id, modalityKey: modKey });
        setEditValue(currentValue.toString());
    };

    const handleCancelEdit = () => {
        setEditingCell(null);
        setEditValue('');
    };

    const handleSaveEdit = () => {
        if (editingCell) {
            const rowData = flatPriceData.find(row => row.id === editingCell.rowId);
            if (rowData) {
                const newPrice = parseFloat(editValue);
                if (!isNaN(newPrice)) {
                    updatePrice(rowData.region, rowData.speciesType, rowData.billingType, rowData.weightRange, editingCell.modalityKey, newPrice);
                }
            }
            handleCancelEdit();
        }
    };
    
    const handleRemoveRange = (row: FlatPriceRow) => {
        if(window.confirm(`Tem certeza que deseja remover a faixa de peso "${row.weightRange}" para esta combinação de filtros?`)) {
            removeWeightRange(row.region, row.speciesType, row.billingType, row.weightRange);
        }
    }

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800">Gerenciamento de Planos e Preços</h2>
                <button
                    onClick={() => setIsAddModalOpen(true)}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-blue-700 transition-colors flex items-center"
                >
                    <Plus className="h-5 w-5 mr-2" />
                    Adicionar Faixa de Peso
                </button>
            </div>

            <div className="bg-white rounded-lg shadow-md overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Região</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Espécie</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Faturamento</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Faixa de Peso</th>
                                {modalities.map(mod => (
                                    <th key={mod.key} className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        <div className="flex items-center justify-end gap-2">
                                            <span>{mod.label}</span>
                                            <button onClick={() => toggleModalityStatus(mod.key)} title={mod.active ? 'Suspender modalidade' : 'Ativar modalidade'}>
                                                {mod.active ? <Eye size={16} className="text-green-600"/> : <EyeOff size={16} className="text-red-600"/>}
                                            </button>
                                        </div>
                                    </th>
                                ))}
                                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Ação</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {flatPriceData.map(row => {
                                return (
                                    <tr key={row.id} className="hover:bg-gray-50 group">
                                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-800">{regionLabels[row.region]}</td>
                                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-800">{speciesLabels[row.speciesType]}</td>
                                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-800">{billingLabels[row.billingType]}</td>
                                        <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{row.weightRange}</td>
                                        {modalities.map(mod => {
                                            const isEditing = editingCell?.rowId === row.id && editingCell?.modalityKey === mod.key;
                                            const currentValue = row.prices[mod.key];
                                            return (
                                                <td key={mod.key} className="px-4 py-4 whitespace-nowrap text-sm text-right text-gray-700">
                                                    {isEditing ? (
                                                        <div className="flex items-center justify-end gap-1">
                                                            <input
                                                                type="number"
                                                                value={editValue}
                                                                onChange={(e) => setEditValue(e.target.value)}
                                                                className="w-24 px-2 py-1 border rounded-md text-right"
                                                                autoFocus
                                                            />
                                                            <button onClick={handleSaveEdit} className="p-1 text-green-600"><Save size={16}/></button>
                                                            <button onClick={handleCancelEdit} className="p-1 text-red-600"><X size={16}/></button>
                                                        </div>
                                                    ) : (
                                                        <div className="flex items-center justify-end gap-2">
                                                            <span>R$ {currentValue !== undefined ? currentValue.toFixed(2) : 'N/A'}</span>
                                                            <button onClick={() => handleEditClick(row, mod.key, currentValue || 0)} className="p-1 text-gray-400 hover:text-blue-600 opacity-0 group-hover:opacity-100"><Edit size={14}/></button>
                                                        </div>
                                                    )}
                                                </td>
                                            );
                                        })}
                                        <td className="px-4 py-4 whitespace-nowrap text-center">
                                            <div className="flex items-center justify-center gap-4">
                                                <button onClick={() => setEditingRow(row)} className="text-blue-600 hover:text-blue-800" title="Editar preços da faixa">
                                                    <ClipboardEdit size={18} />
                                                </button>
                                                <button onClick={() => handleRemoveRange(row)} className="text-red-500 hover:text-red-700" title="Remover faixa de peso">
                                                    <Trash2 size={18} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
            {isAddModalOpen && <AddWeightRangeModal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} />}
            {editingRow && (
                <EditPriceRangeModal
                    isOpen={!!editingRow}
                    onClose={() => setEditingRow(null)}
                    rowData={editingRow}
                />
            )}
        </div>
    );
};

export default PricingManagement;
