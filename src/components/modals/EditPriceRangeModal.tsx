import React, { useState, useEffect } from 'react';
import { usePricing } from '../../context/PricingContext';
import { X, Save, DollarSign, Weight, MapPin, Waves, Map as MapIcon, Dog, Rabbit, CreditCard, FileText } from 'lucide-react';
import { PriceRegion, PetSpeciesType, BillingType } from '../../types';
import { FlatPriceRow } from '../master/PricingManagement';

const regionLabels: Record<PriceRegion, { label: string; icon: React.ElementType }> = {
    curitiba_rm: { label: 'Curitiba/RM', icon: MapPin },
    litoral: { label: 'Litoral', icon: Waves },
    sc: { label: 'SC', icon: MapIcon },
};

const speciesLabels: Record<PetSpeciesType, { label: string; icon: React.ElementType }> = {
    normal: { label: 'Não Exótico', icon: Dog },
    exotico: { label: 'Exótico', icon: Rabbit },
};

const billingLabels: Record<BillingType, { label: string; icon: React.ElementType }> = {
    nao_faturado: { label: 'Não Faturado', icon: CreditCard },
    faturado: { label: 'Faturado', icon: FileText },
};

interface EditPriceRangeModalProps {
    isOpen: boolean;
    onClose: () => void;
    rowData: FlatPriceRow;
}

const EditPriceRangeModal: React.FC<EditPriceRangeModalProps> = ({ isOpen, onClose, rowData }) => {
    const { modalities, updatePrice } = usePricing();
    const [currentPrices, setCurrentPrices] = useState<Record<string, string>>({});
    const [error, setError] = useState('');

    useEffect(() => {
        if (rowData) {
            const initialPrices: Record<string, string> = {};
            modalities.forEach(mod => {
                initialPrices[mod.key] = rowData.prices[mod.key]?.toFixed(2) || '0.00';
            });
            setCurrentPrices(initialPrices);
        }
    }, [rowData, modalities]);

    const handlePriceChange = (modalityKey: string, value: string) => {
        setCurrentPrices(prev => ({ ...prev, [modalityKey]: value }));
    };

    const handleSave = () => {
        setError('');
        let hasError = false;

        modalities.forEach(mod => {
            const newPrice = parseFloat(currentPrices[mod.key]);
            if (isNaN(newPrice) || newPrice < 0) {
                setError(`Valor inválido para ${mod.label}.`);
                hasError = true;
                return;
            }
            if (newPrice !== (rowData.prices[mod.key] || 0)) {
                updatePrice(rowData.region, rowData.speciesType, rowData.billingType, rowData.weightRange, mod.key, newPrice);
            }
        });

        if (!hasError) {
            onClose();
        }
    };

    if (!isOpen) return null;

    const RegionIcon = regionLabels[rowData.region].icon;
    const SpeciesIcon = speciesLabels[rowData.speciesType].icon;
    const BillingIcon = billingLabels[rowData.billingType].icon;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-lg w-full">
                <div className="p-4 border-b flex justify-between items-center">
                    <h2 className="text-xl font-bold text-gray-900">Editar Preços da Faixa</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X className="h-6 w-6" /></button>
                </div>
                <div className="p-6 space-y-6">
                    <div className="p-4 bg-gray-50 rounded-lg border space-y-3">
                        <div className="flex items-center text-sm text-gray-700"><RegionIcon size={16} className="mr-2" /><strong>Região:</strong><span className="ml-2">{regionLabels[rowData.region].label}</span></div>
                        <div className="flex items-center text-sm text-gray-700"><SpeciesIcon size={16} className="mr-2" /><strong>Espécie:</strong><span className="ml-2">{speciesLabels[rowData.speciesType].label}</span></div>
                        <div className="flex items-center text-sm text-gray-700"><BillingIcon size={16} className="mr-2" /><strong>Faturamento:</strong><span className="ml-2">{billingLabels[rowData.billingType].label}</span></div>
                        <div className="flex items-center text-sm text-gray-700"><Weight size={16} className="mr-2" /><strong>Faixa de Peso:</strong><span className="ml-2 font-semibold">{rowData.weightRange}</span></div>
                    </div>

                    <div className="space-y-4">
                        <h4 className="font-medium text-gray-800 flex items-center"><DollarSign size={16} className="mr-2" />Preços por Modalidade</h4>
                        {modalities.filter(m => m.active).map(mod => (
                            <div key={mod.key}>
                                <label className="block text-sm font-medium text-gray-700 mb-1">{mod.label}</label>
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">R$</span>
                                    <input
                                        type="number"
                                        value={currentPrices[mod.key] || ''}
                                        onChange={e => handlePriceChange(mod.key, e.target.value)}
                                        placeholder="0.00"
                                        min="0"
                                        step="0.01"
                                        required
                                        className="w-full px-3 py-2 pl-8 border rounded-md"
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                    {error && <p className="text-red-500 text-sm">{error}</p>}
                </div>
                <div className="bg-gray-50 p-4 border-t flex justify-end items-center gap-4">
                    <button type="button" onClick={onClose} className="px-6 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300">Cancelar</button>
                    <button type="button" onClick={handleSave} className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center gap-2">
                        <Save size={16} /> Salvar Alterações
                    </button>
                </div>
            </div>
        </div>
    );
};

export default EditPriceRangeModal;
