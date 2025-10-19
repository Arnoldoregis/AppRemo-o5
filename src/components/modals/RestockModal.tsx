import React, { useState, useMemo } from 'react';
import { useStock } from '../../context/StockContext';
import { StockItem } from '../../types';
import { X, Search, Plus, ArrowLeft } from 'lucide-react';

interface RestockModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const RestockModal: React.FC<RestockModalProps> = ({ isOpen, onClose }) => {
    const { stock, updateProduct } = useStock();
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedProduct, setSelectedProduct] = useState<StockItem | null>(null);
    const [quantityToAdd, setQuantityToAdd] = useState('');

    const filteredProducts = useMemo(() => {
        if (!searchTerm) return [];
        const lowerCaseSearch = searchTerm.toLowerCase();
        return stock.filter(item => 
            item.name.toLowerCase().includes(lowerCaseSearch) ||
            item.trackingCode.includes(lowerCaseSearch)
        );
    }, [stock, searchTerm]);

    const handleSelectProduct = (product: StockItem) => {
        setSelectedProduct(product);
        setSearchTerm('');
    };

    const handleConfirmRestock = () => {
        if (!selectedProduct || !quantityToAdd) return;
        const quantity = parseInt(quantityToAdd, 10);
        if (isNaN(quantity) || quantity <= 0) {
            alert('Por favor, insira uma quantidade válida.');
            return;
        }

        const newQuantity = selectedProduct.quantity + quantity;
        updateProduct(selectedProduct.id, { quantity: newQuantity });
        
        handleClose();
    };

    const handleClose = () => {
        setSearchTerm('');
        setSelectedProduct(null);
        setQuantityToAdd('');
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-lg w-full">
                <div className="p-4 border-b flex justify-between items-center">
                    <h2 className="text-xl font-bold text-gray-900">Repor Estoque de Produto</h2>
                    <button onClick={handleClose} className="text-gray-400 hover:text-gray-600"><X className="h-6 w-6" /></button>
                </div>
                
                <div className="p-6">
                    {!selectedProduct ? (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Buscar Produto</label>
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                                <input 
                                    type="text" 
                                    value={searchTerm}
                                    onChange={e => setSearchTerm(e.target.value)}
                                    placeholder="Digite o nome ou código do produto..."
                                    className="w-full pl-10 pr-4 py-2 border rounded-lg"
                                    autoFocus
                                />
                            </div>
                            {searchTerm && (
                                <div className="mt-4 max-h-60 overflow-y-auto border rounded-md">
                                    {filteredProducts.length > 0 ? (
                                        <ul className="divide-y">
                                            {filteredProducts.map(product => (
                                                <li 
                                                    key={product.id} 
                                                    onClick={() => handleSelectProduct(product)}
                                                    className="p-3 hover:bg-gray-100 cursor-pointer"
                                                >
                                                    <p className="font-semibold">{product.name} <span className="font-normal text-gray-500">({product.trackingCode})</span></p>
                                                    <p className="text-sm text-gray-600">Estoque atual: {product.quantity}</p>
                                                </li>
                                            ))}
                                        </ul>
                                    ) : (
                                        <p className="p-4 text-center text-gray-500">Nenhum produto encontrado.</p>
                                    )}
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <button onClick={() => setSelectedProduct(null)} className="flex items-center text-sm text-blue-600 hover:underline">
                                <ArrowLeft size={16} className="mr-1" />
                                Voltar para a busca
                            </button>
                            <div className="p-4 bg-gray-50 rounded-lg border">
                                <p className="font-semibold text-lg">{selectedProduct.name}</p>
                                <p className="text-sm text-gray-600">Código: {selectedProduct.trackingCode}</p>
                                <p className="text-sm text-gray-600">Estoque Atual: <span className="font-bold">{selectedProduct.quantity}</span></p>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Quantidade a Adicionar</label>
                                <input 
                                    type="number"
                                    value={quantityToAdd}
                                    onChange={e => setQuantityToAdd(e.target.value)}
                                    placeholder="0"
                                    min="1"
                                    required
                                    className="w-full px-3 py-2 border rounded-md"
                                    autoFocus
                                />
                            </div>
                        </div>
                    )}
                </div>

                <div className="bg-gray-50 p-4 border-t flex justify-end items-center gap-4">
                    <button type="button" onClick={handleClose} className="px-6 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300">Cancelar</button>
                    {selectedProduct && (
                        <button 
                            type="button" 
                            onClick={handleConfirmRestock}
                            disabled={!quantityToAdd || parseInt(quantityToAdd, 10) <= 0}
                            className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 flex items-center gap-2 disabled:opacity-50"
                        >
                            <Plus size={16} /> Confirmar Reposição
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default RestockModal;
