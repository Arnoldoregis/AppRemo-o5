import React, { useState, useMemo } from 'react';
import { Removal, StockItem } from '../../types';
import { useRemovals } from '../../context/RemovalContext';
import { useStock } from '../../context/StockContext';
import { useAuth } from '../../context/AuthContext';
import { X, Package, Droplet, Check, Search } from 'lucide-react';

interface AssembleBagModalProps {
    isOpen: boolean;
    onClose: () => void;
    removal: Removal;
}

const AssembleBagModal: React.FC<AssembleBagModalProps> = ({ isOpen, onClose, removal }) => {
    const { updateRemoval } = useRemovals();
    const { stock, deductStockItems } = useStock();
    const { user } = useAuth();

    // Urn State
    const [includeUrn, setIncludeUrn] = useState(true);
    const [urnSearchTerm, setUrnSearchTerm] = useState('');
    const [selectedUrn, setSelectedUrn] = useState<StockItem | null>(null);
    const [urnQuantity, setUrnQuantity] = useState('1');

    // Paw Print State
    const [includePaw, setIncludePaw] = useState(false);
    const [pawSearchTerm, setPawSearchTerm] = useState('');
    const [selectedPaw, setSelectedPaw] = useState<StockItem | null>(null);
    const [pawQuantity, setPawQuantity] = useState('1');

    const urnResults = useMemo(() => {
        if (!urnSearchTerm) return [];
        const lower = urnSearchTerm.toLowerCase();
        return stock.filter(item =>
            item.name.toLowerCase().includes('urna') &&
            (item.name.toLowerCase().includes(lower) || item.trackingCode.includes(lower))
        );
    }, [stock, urnSearchTerm]);

    const pawResults = useMemo(() => {
        if (!pawSearchTerm) return [];
        const lower = pawSearchTerm.toLowerCase();
        return stock.filter(item =>
            item.name.toLowerCase().includes('patinha') &&
            (item.name.toLowerCase().includes(lower) || item.trackingCode.includes(lower))
        );
    }, [stock, pawSearchTerm]);

    const handleSelectUrn = (product: StockItem) => {
        setSelectedUrn(product);
        setUrnSearchTerm('');
    };

    const handleSelectPaw = (product: StockItem) => {
        setSelectedPaw(product);
        setPawSearchTerm('');
    };

    if (!isOpen) return null;

    const handleSubmit = () => {
        if (!user) return;

        const itemsToDeduct: { name: string; quantity: number }[] = [];
        if (includeUrn) {
            const urnQty = parseInt(urnQuantity, 10);
            if (!selectedUrn || isNaN(urnQty) || urnQty <= 0) {
                alert('Por favor, selecione um produto de urna e especifique a quantidade.');
                return;
            }
            itemsToDeduct.push({ name: selectedUrn.name, quantity: urnQty });
        }
        if (includePaw) {
            const pawQty = parseInt(pawQuantity, 10);
            if (!selectedPaw || isNaN(pawQty) || pawQty <= 0) {
                alert('Por favor, selecione um produto de patinha e especifique a quantidade.');
                return;
            }
            itemsToDeduct.push({ name: selectedPaw.name, quantity: pawQty });
        }

        deductStockItems(itemsToDeduct);

        const bagDetails = {
            standardUrn: {
                included: includeUrn,
                productId: includeUrn ? selectedUrn?.id : undefined,
                productName: includeUrn ? selectedUrn?.name : undefined,
                quantity: includeUrn ? parseInt(urnQuantity, 10) : undefined,
            },
            pawPrint: {
                included: includePaw,
                productId: includePaw ? selectedPaw?.id : undefined,
                productName: includePaw ? selectedPaw?.name : undefined,
                quantity: includePaw ? parseInt(pawQuantity, 10) : undefined,
            }
        };

        const historyAction = `Sacola montada por ${user.name.split(' ')[0]}. Urna: ${includeUrn ? `${urnQuantity}x ${selectedUrn?.name}` : 'Não'}, Patinha: ${includePaw ? `${pawQuantity}x ${selectedPaw?.name}` : 'Não'}.`;

        updateRemoval(removal.code, {
            status: 'pronto_para_entrega',
            bagAssemblyDetails: bagDetails,
            history: [
                ...removal.history,
                { date: new Date().toISOString(), action: historyAction, user: user.name }
            ]
        });

        onClose();
    };

    const renderSearchInput = (
        productType: 'urn' | 'paw'
    ) => {
        const searchTerm = productType === 'urn' ? urnSearchTerm : pawSearchTerm;
        const setSearchTerm = productType === 'urn' ? setUrnSearchTerm : setPawSearchTerm;
        const selectedProduct = productType === 'urn' ? selectedUrn : selectedPaw;
        const setSelectedProduct = productType === 'urn' ? setSelectedUrn : setSelectedPaw;
        const results = productType === 'urn' ? urnResults : pawResults;
        const handleSelect = productType === 'urn' ? handleSelectUrn : handleSelectPaw;

        return (
            <div className="relative">
                <label className="text-xs font-medium text-gray-600">Produto</label>
                <div className="relative mt-1">
                    <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                        type="text"
                        value={selectedProduct ? selectedProduct.name : searchTerm}
                        onChange={e => {
                            setSearchTerm(e.target.value);
                            if (selectedProduct) setSelectedProduct(null);
                        }}
                        placeholder="Buscar por nome ou código..."
                        className="w-full pl-8 pr-8 py-1.5 border rounded-md text-sm"
                        disabled={!!selectedProduct}
                    />
                    {selectedProduct && (
                        <button onClick={() => setSelectedProduct(null)} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                            <X size={16} />
                        </button>
                    )}
                </div>

                {searchTerm && results.length > 0 && !selectedProduct && (
                    <div className="absolute w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg z-10 max-h-40 overflow-y-auto">
                        {results.map(product => (
                            <div key={product.id} onClick={() => handleSelect(product)} className="px-3 py-2 hover:bg-gray-100 cursor-pointer text-sm">
                                <p className="font-semibold">{product.name}</p>
                                <p className="text-xs text-gray-500">Código: {product.trackingCode} | Estoque: {product.quantity}</p>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-lg w-full">
                <div className="p-4 border-b flex justify-between items-center">
                    <h2 className="text-xl font-bold text-gray-900">Montar Sacola - {removal.code}</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X className="h-6 w-6" /></button>
                </div>
                <div className="p-6 space-y-6">
                    <div className="space-y-4 p-4 border rounded-lg">
                        <label className="flex items-center justify-between cursor-pointer">
                            <span className="font-semibold text-gray-800 flex items-center"><Package className="mr-2 h-5 w-5 text-blue-600"/>Incluir Urna Padrão</span>
                            <div className="relative">
                                <input type="checkbox" className="sr-only" checked={includeUrn} onChange={(e) => setIncludeUrn(e.target.checked)} />
                                <div className={`block w-14 h-8 rounded-full ${includeUrn ? 'bg-blue-600' : 'bg-gray-200'}`}></div>
                                <div className={`dot absolute left-1 top-1 bg-white w-6 h-6 rounded-full transition-transform ${includeUrn ? 'translate-x-6' : ''}`}></div>
                            </div>
                        </label>
                        {includeUrn && (
                            <div className="grid grid-cols-2 gap-4 pt-2">
                                {renderSearchInput('urn')}
                                <div>
                                    <label className="text-xs font-medium text-gray-600">Quantidade</label>
                                    <input type="number" value={urnQuantity} onChange={e => setUrnQuantity(e.target.value)} min="1" className="w-full mt-1 px-2 py-1.5 border rounded-md text-sm" />
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="space-y-4 p-4 border rounded-lg">
                        <label className="flex items-center justify-between cursor-pointer">
                            <span className="font-semibold text-gray-800 flex items-center"><Droplet className="mr-2 h-5 w-5 text-purple-600"/>Incluir Patinha (Kit Resina)</span>
                            <div className="relative">
                                <input type="checkbox" className="sr-only" checked={includePaw} onChange={(e) => setIncludePaw(e.target.checked)} />
                                <div className={`block w-14 h-8 rounded-full ${includePaw ? 'bg-purple-600' : 'bg-gray-200'}`}></div>
                                <div className={`dot absolute left-1 top-1 bg-white w-6 h-6 rounded-full transition-transform ${includePaw ? 'translate-x-6' : ''}`}></div>
                            </div>
                        </label>
                        {includePaw && (
                            <div className="grid grid-cols-2 gap-4 pt-2">
                                {renderSearchInput('paw')}
                                <div>
                                    <label className="text-xs font-medium text-gray-600">Quantidade</label>
                                    <input type="number" value={pawQuantity} onChange={e => setPawQuantity(e.target.value)} min="1" className="w-full mt-1 px-2 py-1.5 border rounded-md text-sm" />
                                </div>
                            </div>
                        )}
                    </div>
                </div>
                <div className="bg-gray-50 p-4 border-t flex justify-end items-center gap-4">
                    <button type="button" onClick={onClose} className="px-6 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300">Cancelar</button>
                    <button type="button" onClick={handleSubmit} className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 flex items-center gap-2">
                        <Check size={16} /> Confirmar e Enviar
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AssembleBagModal;
