import React, { useState, useEffect } from 'react';
import { useStock } from '../../context/StockContext';
import { StockCategory } from '../../types';
import { X } from 'lucide-react';

interface AddProductModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const AddProductModal: React.FC<AddProductModalProps> = ({ isOpen, onClose }) => {
    const { addProduct } = useStock();
    const [name, setName] = useState('');
    const [category, setCategory] = useState<StockCategory>('material_venda');
    const [quantity, setQuantity] = useState('');
    const [unitDescription, setUnitDescription] = useState('');
    const [sellingPrice, setSellingPrice] = useState('');
    const [minAlertQuantity, setMinAlertQuantity] = useState('');
    const [error, setError] = useState('');

    const isSobEncomenda = category === 'sob_encomenda';

    useEffect(() => {
        if (isSobEncomenda) {
            setQuantity('0');
        }
    }, [isSobEncomenda]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        const numQuantity = parseInt(quantity, 10);
        const numSellingPrice = parseFloat(sellingPrice) || 0;
        const numMinAlertQuantity = minAlertQuantity ? parseInt(minAlertQuantity, 10) : undefined;

        if (!name || !category) {
            setError('Nome e Categoria são obrigatórios.');
            return;
        }
        if (!isSobEncomenda && (isNaN(numQuantity) || numQuantity < 0)) {
            setError('Quantidade deve ser um número válido (0 ou mais).');
            return;
        }
        if (isNaN(numSellingPrice) || numSellingPrice < 0) {
            setError('Preço de venda deve ser um número válido.');
            return;
        }
        if (numMinAlertQuantity !== undefined && (isNaN(numMinAlertQuantity) || numMinAlertQuantity < 0)) {
            setError('Quantidade mínima para alerta deve ser um número válido.');
            return;
        }

        addProduct({
            name,
            category,
            quantity: isSobEncomenda ? 0 : numQuantity,
            unitDescription: unitDescription || undefined,
            sellingPrice: numSellingPrice,
            minAlertQuantity: numMinAlertQuantity,
        });
        
        onClose();
    };

    if (!isOpen) return null;

    const categoryOptions: { value: StockCategory; label: string }[] = [
        { value: 'material_venda', label: 'Material para Venda' },
        { value: 'material_escritorio', label: 'Material de Escritório' },
        { value: 'material_limpeza', label: 'Material de Limpeza' },
        { value: 'sob_encomenda', label: 'Sob Encomenda' },
    ];

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-lg w-full">
                <div className="p-4 border-b flex justify-between items-center">
                    <h2 className="text-xl font-bold text-gray-900">Adicionar Novo Produto ao Estoque</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X className="h-6 w-6" /></button>
                </div>
                <form onSubmit={handleSubmit}>
                    <div className="p-6 space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Nome do Produto</label>
                            <input type="text" value={name} onChange={e => setName(e.target.value)} required className="w-full px-3 py-2 border rounded-md" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Categoria</label>
                            <select value={category} onChange={e => setCategory(e.target.value as StockCategory)} required className="w-full px-3 py-2 border rounded-md bg-white">
                                {categoryOptions.map(opt => (
                                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                                ))}
                            </select>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Quantidade</label>
                                <input 
                                    type="number" 
                                    value={quantity} 
                                    onChange={e => setQuantity(e.target.value)} 
                                    required 
                                    min="0" 
                                    disabled={isSobEncomenda}
                                    className="w-full px-3 py-2 border rounded-md disabled:bg-gray-100" 
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Descrição da Unidade</label>
                                <input type="text" value={unitDescription} onChange={e => setUnitDescription(e.target.value)} placeholder='Ex: Caixa c/ 100, Pacote' className="w-full px-3 py-2 border rounded-md" />
                            </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Preço de Venda (R$)</label>
                                <input type="number" value={sellingPrice} onChange={e => setSellingPrice(e.target.value)} placeholder="0.00 (se não for para venda)" min="0.00" step="0.01" className="w-full px-3 py-2 border rounded-md" />
                            </div>
                             <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Qtd. Mínima p/ Alerta</label>
                                <input 
                                    type="number" 
                                    value={minAlertQuantity} 
                                    onChange={e => setMinAlertQuantity(e.target.value)} 
                                    placeholder="Ex: 10" 
                                    min="0" 
                                    className="w-full px-3 py-2 border rounded-md" 
                                />
                            </div>
                        </div>
                        {error && <p className="text-red-500 text-sm">{error}</p>}
                    </div>
                    <div className="bg-gray-50 p-4 border-t flex justify-end items-center gap-4">
                        <button type="button" onClick={onClose} className="px-6 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300">Cancelar</button>
                        <button type="submit" className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">Adicionar Produto</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AddProductModal;
