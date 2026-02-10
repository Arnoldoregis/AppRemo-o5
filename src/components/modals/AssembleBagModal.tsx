import React, { useState, useMemo } from 'react';
import { Removal, StockItem } from '../../types';
import { useRemovals } from '../../context/RemovalContext';
import { useStock } from '../../context/StockContext';
import { useAuth } from '../../context/AuthContext';
import { X, Check, Package, Flame, FileText, Search, User, Dog, Hash } from 'lucide-react';
import { adicionaisDisponiveis } from '../../data/pricing';

interface AssembleBagModalProps {
    isOpen: boolean;
    onClose: () => void;
    removal: Removal;
}

const AssembleBagModal: React.FC<AssembleBagModalProps> = ({ isOpen, onClose, removal }) => {
    const { updateRemoval } = useRemovals();
    const { stock, deductProductById } = useStock();
    const { user } = useAuth();

    // Checkbox states for mandatory items
    const [hasUrn, setHasUrn] = useState(false);
    const [hasAshes, setHasAshes] = useState(false);
    const [hasCertificate, setHasCertificate] = useState(false);

    // Stock selection states (for Urn if needed)
    const [urnSearchTerm, setUrnSearchTerm] = useState('');
    const [selectedUrn, setSelectedUrn] = useState<StockItem | null>(null);
    const [urnQuantity, setUrnQuantity] = useState('1');

    // Lista de produtos já vinculados à remoção
    const removalProducts = useMemo(() => {
        const items: string[] = [];
        
        // Itens do plano
        if (removal.modality === 'individual_ouro') items.push('Patinha (Plano Ouro)');
        
        // Adicionais padrão
        removal.additionals?.forEach(ad => {
            const label = adicionaisDisponiveis.find(a => a.type === ad.type)?.label || ad.type;
            items.push(`${ad.quantity}x ${label}`);
        });

        // Adicionais customizados
        removal.customAdditionals?.forEach(ad => {
            items.push(`${ad.name}`);
        });

        return items;
    }, [removal]);

    // Filtro de busca para urna no estoque
    const urnResults = useMemo(() => {
        if (!urnSearchTerm) return [];
        const lower = urnSearchTerm.toLowerCase();
        return stock.filter(item =>
            item.name.toLowerCase().includes('urna') &&
            (item.name.toLowerCase().includes(lower) || item.trackingCode.includes(lower))
        );
    }, [stock, urnSearchTerm]);

    const handleSelectUrn = (product: StockItem) => {
        setSelectedUrn(product);
        setUrnSearchTerm('');
    };

    const handleSubmit = () => {
        if (!user) return;

        if (!hasUrn || !hasAshes || !hasCertificate) {
            alert('Por favor, confirme que a Urna, as Cinzas e o Certificado estão na sacola.');
            return;
        }

        if (selectedUrn) {
             const urnQty = parseInt(urnQuantity, 10);
             if (isNaN(urnQty) || urnQty <= 0) {
                 alert('Quantidade de urna inválida.');
                 return;
             }
             deductProductById(selectedUrn.id, urnQty, user.name);
        }

        const bagDetails = {
            standardUrn: {
                included: hasUrn,
                productId: selectedUrn?.id,
                productName: selectedUrn?.name || 'Urna Padrão/Confirmada',
                quantity: selectedUrn ? parseInt(urnQuantity, 10) : 1,
            },
            pawPrint: { included: false }
        };

        const historyAction = `Sacola montada e conferida por ${user.name.split(' ')[0]}. Itens conferidos: Urna, Cinzas, Certificado.`;

        // Atualiza o status para 'pronto_para_entrega' usando o ID correto
        updateRemoval(removal.id, {
            status: 'pronto_para_entrega',
            bagAssemblyDetails: bagDetails,
            history: [
                ...removal.history,
                { date: new Date().toISOString(), action: historyAction, user: user.name }
            ]
        });

        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-[80] p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-lg w-full flex flex-col max-h-[90vh]">
                {/* Header */}
                <div className="p-4 border-b flex justify-between items-center bg-purple-50 rounded-t-lg">
                    <h2 className="text-xl font-bold text-purple-900 flex items-center gap-2">
                        <Package size={24} />
                        Conferência de Sacola
                    </h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X className="h-6 w-6" /></button>
                </div>

                <div className="p-6 space-y-6 overflow-y-auto">
                    {/* Info Card */}
                    <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 space-y-2">
                        <div className="flex items-center gap-2 text-gray-700">
                            <Hash size={16} className="text-purple-600" />
                            <span className="font-semibold">Código:</span> {removal.code}
                        </div>
                        <div className="flex items-center gap-2 text-gray-700">
                            <User size={16} className="text-purple-600" />
                            <span className="font-semibold">Tutor:</span> {removal.tutor.name}
                        </div>
                        <div className="flex items-center gap-2 text-gray-700">
                            <Dog size={16} className="text-purple-600" />
                            <span className="font-semibold">Pet:</span> {removal.pet.name}
                        </div>
                    </div>

                    {/* Products List */}
                    <div>
                        <h3 className="font-semibold text-gray-800 mb-2">Produtos na Remoção:</h3>
                        {removalProducts.length > 0 ? (
                            <ul className="list-disc list-inside bg-gray-50 p-3 rounded-md border text-sm text-gray-700">
                                {removalProducts.map((item, idx) => (
                                    <li key={idx}>{item}</li>
                                ))}
                            </ul>
                        ) : (
                            <p className="text-sm text-gray-500 italic">Nenhum produto adicional listado.</p>
                        )}
                    </div>

                    {/* Checklist Icons with Checkboxes */}
                    <div>
                        <h3 className="font-semibold text-gray-800 mb-3 text-center">Itens Obrigatórios na Sacola</h3>
                        <div className="grid grid-cols-3 gap-4">
                            {/* Urna */}
                            <div 
                                onClick={() => setHasUrn(!hasUrn)}
                                className={`cursor-pointer p-3 rounded-lg border-2 flex flex-col items-center justify-center gap-2 transition-all ${
                                    hasUrn ? 'border-purple-500 bg-purple-50' : 'border-gray-200 hover:border-purple-200 bg-white'
                                }`}
                            >
                                <div className={`w-6 h-6 rounded border-2 flex items-center justify-center transition-colors ${
                                    hasUrn ? 'bg-purple-600 border-purple-600' : 'border-gray-300 bg-white'
                                }`}>
                                    {hasUrn && <Check size={16} className="text-white" />}
                                </div>
                                <Package size={28} className={hasUrn ? 'text-purple-600' : 'text-gray-400'} />
                                <span className={`font-semibold text-sm ${hasUrn ? 'text-purple-700' : 'text-gray-600'}`}>Urna</span>
                            </div>

                            {/* Cinzas */}
                            <div 
                                onClick={() => setHasAshes(!hasAshes)}
                                className={`cursor-pointer p-3 rounded-lg border-2 flex flex-col items-center justify-center gap-2 transition-all ${
                                    hasAshes ? 'border-purple-500 bg-purple-50' : 'border-gray-200 hover:border-purple-200 bg-white'
                                }`}
                            >
                                <div className={`w-6 h-6 rounded border-2 flex items-center justify-center transition-colors ${
                                    hasAshes ? 'bg-purple-600 border-purple-600' : 'border-gray-300 bg-white'
                                }`}>
                                    {hasAshes && <Check size={16} className="text-white" />}
                                </div>
                                <Flame size={28} className={hasAshes ? 'text-purple-600' : 'text-gray-400'} />
                                <span className={`font-semibold text-sm ${hasAshes ? 'text-purple-700' : 'text-gray-600'}`}>Cinzas</span>
                            </div>

                            {/* Certificado */}
                            <div 
                                onClick={() => setHasCertificate(!hasCertificate)}
                                className={`cursor-pointer p-3 rounded-lg border-2 flex flex-col items-center justify-center gap-2 transition-all ${
                                    hasCertificate ? 'border-purple-500 bg-purple-50' : 'border-gray-200 hover:border-purple-200 bg-white'
                                }`}
                            >
                                <div className={`w-6 h-6 rounded border-2 flex items-center justify-center transition-colors ${
                                    hasCertificate ? 'bg-purple-600 border-purple-600' : 'border-gray-300 bg-white'
                                }`}>
                                    {hasCertificate && <Check size={16} className="text-white" />}
                                </div>
                                <FileText size={28} className={hasCertificate ? 'text-purple-600' : 'text-gray-400'} />
                                <span className={`font-semibold text-sm ${hasCertificate ? 'text-purple-700' : 'text-gray-600'}`}>Certificado</span>
                            </div>
                        </div>
                    </div>

                    {/* Optional Urn Selection (Stock Deduction) */}
                    {hasUrn && (
                        <div className="pt-2 border-t">
                            <p className="text-xs text-gray-500 mb-2">Se necessário, selecione a urna do estoque para dar baixa:</p>
                            <div className="relative">
                                <div className="relative">
                                    <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                    <input
                                        type="text"
                                        value={selectedUrn ? selectedUrn.name : urnSearchTerm}
                                        onChange={e => {
                                            setUrnSearchTerm(e.target.value);
                                            if (selectedUrn) setSelectedUrn(null);
                                        }}
                                        placeholder="Buscar Urna no estoque..."
                                        className="w-full pl-8 pr-8 py-1.5 border rounded-md text-sm"
                                        disabled={!!selectedUrn}
                                    />
                                    {selectedUrn && (
                                        <button onClick={() => setSelectedUrn(null)} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                                            <X size={16} />
                                        </button>
                                    )}
                                </div>
                                {urnSearchTerm && urnResults.length > 0 && !selectedUrn && (
                                    <div className="absolute w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg z-10 max-h-40 overflow-y-auto">
                                        {urnResults.map(product => (
                                            <div key={product.id} onClick={() => handleSelectUrn(product)} className="px-3 py-2 hover:bg-gray-100 cursor-pointer text-sm">
                                                <p className="font-semibold">{product.name}</p>
                                                <p className="text-xs text-gray-500">Estoque: {product.quantity}</p>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-4 border-t bg-gray-50 flex justify-end gap-2 rounded-b-lg">
                    <button onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300">
                        Cancelar
                    </button>
                    <button 
                        onClick={handleSubmit}
                        disabled={!hasUrn || !hasAshes || !hasCertificate}
                        className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <Check size={16} />
                        Confirmar Sacola Montada
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AssembleBagModal;
