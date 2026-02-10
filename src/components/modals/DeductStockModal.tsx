import React, { useState, useMemo } from 'react';
import { useStock } from '../../context/StockContext';
import { useAuth } from '../../context/AuthContext';
import { X, Search, PackageMinus, CheckCircle, AlertTriangle } from 'lucide-react';
import { StockItem } from '../../types';

interface DeductStockModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const DeductStockModal: React.FC<DeductStockModalProps> = ({ isOpen, onClose }) => {
    const { stock, deductProductById } = useStock();
    const { user } = useAuth();
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedProduct, setSelectedProduct] = useState<StockItem | null>(null);
    const [quantity, setQuantity] = useState('');

    const filteredProducts = useMemo(() => {
        if (!searchTerm) return [];
        const lower = searchTerm.toLowerCase();
        return stock.filter(item => 
            item.name.toLowerCase().includes(lower) || 
            item.trackingCode.includes(lower)
        );
    }, [stock, searchTerm]);

    const handleSelectProduct = (product: StockItem) => {
        setSelectedProduct(product);
        setSearchTerm('');
        setQuantity('1');
    };

    const handleDeduct = () => {
        if (!selectedProduct || !user) return;
        const qty = parseInt(quantity, 10);
        
        if (isNaN(qty) || qty <= 0) {
            alert('Por favor, insira uma quantidade válida.');
            return;
        }

        deductProductById(selectedProduct.id, qty, user.name);
        alert(`Baixa de ${qty} unidade(s) de "${selectedProduct.name}" realizada com sucesso!`);
        handleClose();
    };

    const handleClose = () => {
        setSearchTerm('');
        setSelectedProduct(null);
        setQuantity('');
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-[80] p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
                <div className="p-4 border-b flex justify-between items-center bg-orange-50 rounded-t-lg">
                    <h2 className="text-lg font-bold text-orange-800 flex items-center">
                        <PackageMinus className="h-5 w-5 mr-2" />
                        Baixar no Estoque
                    </h2>
                    <button onClick={handleClose} className="text-gray-400 hover:text-gray-600"><X className="h-6 w-6" /></button>
                </div>

                <div className="p-6">
                    {!selectedProduct ? (
                        <div className="space-y-4">
                            <label className="block text-sm font-medium text-gray-700">Buscar Produto</label>
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                                <input 
                                    type="text" 
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    placeholder="Digite nome ou código..."
                                    className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                                    autoFocus
                                />
                            </div>
                            
                            {searchTerm && (
                                <div className="max-h-60 overflow-y-auto border rounded-md mt-2">
                                    {filteredProducts.length > 0 ? (
                                        <ul className="divide-y">
                                            {filteredProducts.map(product => (
                                                <li 
                                                    key={product.id} 
                                                    onClick={() => handleSelectProduct(product)}
                                                    className="p-3 hover:bg-orange-50 cursor-pointer flex justify-between items-center"
                                                >
                                                    <div>
                                                        <p className="font-medium text-gray-800">{product.name}</p>
                                                        <p className="text-xs text-gray-500">Cód: {product.trackingCode}</p>
                                                    </div>
                                                    <span className={`text-xs font-semibold px-2 py-1 rounded-full ${product.quantity > 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                                        Estoque: {product.quantity}
                                                    </span>
                                                </li>
                                            ))}
                                        </ul>
                                    ) : (
                                        <p className="p-4 text-center text-gray-500 text-sm">Nenhum produto encontrado.</p>
                                    )}
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="space-y-6">
                            <div className="bg-gray-50 p-4 rounded-lg border">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <h3 className="font-bold text-gray-900">{selectedProduct.name}</h3>
                                        <p className="text-sm text-gray-500">Cód: {selectedProduct.trackingCode}</p>
                                    </div>
                                    <button onClick={() => setSelectedProduct(null)} className="text-xs text-blue-600 hover:underline">Trocar</button>
                                </div>
                                <div className="mt-2 text-sm">
                                    Estoque Atual: <strong>{selectedProduct.quantity}</strong> {selectedProduct.unitDescription}
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Quantidade a retirar</label>
                                <input 
                                    type="number" 
                                    value={quantity}
                                    onChange={(e) => setQuantity(e.target.value)}
                                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                                    placeholder="0"
                                    min="1"
                                    autoFocus
                                />
                                {parseInt(quantity) > selectedProduct.quantity && (
                                    <p className="text-xs text-red-600 mt-1 flex items-center">
                                        <AlertTriangle size={12} className="mr-1" />
                                        Atenção: Quantidade maior que o estoque atual.
                                    </p>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                <div className="p-4 border-t bg-gray-50 flex justify-end gap-2 rounded-b-lg">
                    <button onClick={handleClose} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors">
                        Cancelar
                    </button>
                    <button 
                        onClick={handleDeduct}
                        disabled={!selectedProduct || !quantity}
                        className="px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <CheckCircle size={16} />
                        Confirmar Baixa
                    </button>
                </div>
            </div>
        </div>
    );
};

export default DeductStockModal;
