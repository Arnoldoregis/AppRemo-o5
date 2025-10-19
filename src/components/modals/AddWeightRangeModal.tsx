import React, { useState } from 'react';
import { usePricing } from '../../context/PricingContext';
import { X, MapPin, Waves, Map as MapIcon, Dog, Rabbit, CreditCard, FileText } from 'lucide-react';
import { PriceRegion, PetSpeciesType, BillingType } from '../../types';

const regionConfig: { id: PriceRegion; label: string; icon: React.ElementType }[] = [
    { id: 'curitiba_rm', label: 'Curitiba/RM', icon: MapPin },
    { id: 'litoral', label: 'Litoral', icon: Waves },
    { id: 'sc', label: 'SC', icon: MapIcon },
];

const speciesConfig: { id: PetSpeciesType; label: string; icon: React.ElementType }[] = [
    { id: 'normal', label: 'Não Exótico', icon: Dog },
    { id: 'exotico', label: 'Exótico', icon: Rabbit },
];

const billingConfig: { id: BillingType; label: string; icon: React.ElementType }[] = [
    { id: 'nao_faturado', label: 'Não Faturado', icon: CreditCard },
    { id: 'faturado', label: 'Faturado', icon: FileText },
];

interface AddWeightRangeModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const AddWeightRangeModal: React.FC<AddWeightRangeModalProps> = ({ isOpen, onClose }) => {
    const { modalities, addWeightRange } = usePricing();
    const [region, setRegion] = useState<PriceRegion>('curitiba_rm');
    const [speciesType, setSpeciesType] = useState<PetSpeciesType>('normal');
    const [billingType, setBillingType] = useState<BillingType>('nao_faturado');
    const [range, setRange] = useState('');
    const [prices, setPrices] = useState<Record<string, string>>({});
    const [error, setError] = useState('');

    const handlePriceChange = (modalityKey: string, value: string) => {
        setPrices(prev => ({ ...prev, [modalityKey]: value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!range.trim()) {
            setError('O nome da faixa de peso é obrigatório.');
            return;
        }

        const finalPrices: Record<string, number> = {};
        let hasError = false;
        modalities.forEach(mod => {
            const price = parseFloat(prices[mod.key] || '0');
            if (isNaN(price)) {
                hasError = true;
            }
            finalPrices[mod.key] = price;
        });

        if (hasError) {
            setError('Todos os preços devem ser números válidos.');
            return;
        }

        addWeightRange(region, speciesType, billingType, range, finalPrices);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-lg w-full">
                <div className="p-4 border-b flex justify-between items-center">
                    <h2 className="text-xl font-bold text-gray-900">Adicionar Nova Faixa de Peso</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X className="h-6 w-6" /></button>
                </div>
                <form onSubmit={handleSubmit}>
                    <div className="p-6 space-y-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Região</label>
                            <div className="flex flex-wrap gap-2">
                                {regionConfig.map(r => (
                                    <button key={r.id} type="button" onClick={() => setRegion(r.id)} className={`px-4 py-2 text-sm font-medium flex items-center gap-2 rounded-lg border-2 ${region === r.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'}`}>
                                        <r.icon size={16} /> {r.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Tipo de Espécie</label>
                            <div className="flex flex-wrap gap-2">
                                {speciesConfig.map(s => (
                                    <button key={s.id} type="button" onClick={() => setSpeciesType(s.id)} className={`px-4 py-2 text-sm font-medium flex items-center gap-2 rounded-lg border-2 ${speciesType === s.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'}`}>
                                        <s.icon size={16} /> {s.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Tipo de Faturamento</label>
                            <div className="flex flex-wrap gap-2">
                                {billingConfig.map(b => (
                                    <button key={b.id} type="button" onClick={() => setBillingType(b.id)} className={`px-4 py-2 text-sm font-medium flex items-center gap-2 rounded-lg border-2 ${billingType === b.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'}`}>
                                        <b.icon size={16} /> {b.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <hr/>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Faixa de Peso (ex: 81-100kg)</label>
                            <input type="text" value={range} onChange={e => setRange(e.target.value)} required className="w-full px-3 py-2 border rounded-md" />
                        </div>
                        <div className="space-y-3">
                            <h4 className="font-medium">Preços por Modalidade</h4>
                            {modalities.map(mod => (
                                <div key={mod.key}>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">{mod.label}</label>
                                    <input
                                        type="number"
                                        value={prices[mod.key] || ''}
                                        onChange={e => handlePriceChange(mod.key, e.target.value)}
                                        placeholder="0.00"
                                        min="0"
                                        step="0.01"
                                        required
                                        className="w-full px-3 py-2 border rounded-md"
                                    />
                                </div>
                            ))}
                        </div>
                        {error && <p className="text-red-500 text-sm">{error}</p>}
                    </div>
                    <div className="bg-gray-50 p-4 border-t flex justify-end items-center gap-4">
                        <button type="button" onClick={onClose} className="px-6 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300">Cancelar</button>
                        <button type="submit" className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">Adicionar Faixa</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AddWeightRangeModal;
