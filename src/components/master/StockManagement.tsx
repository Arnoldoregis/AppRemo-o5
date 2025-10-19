import React, { useState, useMemo } from 'react';
import { useStock } from '../../context/StockContext';
import { Plus, Edit, Trash2, Package, Brush, Briefcase, Star, Tag, AlertCircle, Save, X, Repeat, AlertTriangle } from 'lucide-react';
import { format } from 'date-fns';
import AddProductModal from '../modals/AddProductModal';
import DeleteConfirmationModal from '../modals/DeleteConfirmationModal';
import RestockModal from '../modals/RestockModal';
import { StockCategory, StockItem } from '../../types';

const categoryConfig: { [key in StockCategory]: { label: string; icon: React.ElementType; color: string } } = {
    material_venda: { label: 'Venda', icon: Star, color: 'text-green-600' },
    material_escritorio: { label: 'Escritório', icon: Briefcase, color: 'text-blue-600' },
    material_limpeza: { label: 'Limpeza', icon: Brush, color: 'text-yellow-600' },
    sob_encomenda: { label: 'Sob Encomenda', icon: Package, color: 'text-purple-600' },
};

const defaultConfig = { label: 'Desconhecida', icon: AlertCircle, color: 'text-gray-500' };

type StockFilter = StockCategory | 'todos' | 'estoque_baixo';

const StockManagement: React.FC = () => {
    const { stock, updateProduct, deleteProduct } = useStock();
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isRestockModalOpen, setIsRestockModalOpen] = useState(false);
    const [activeFilter, setActiveFilter] = useState<StockFilter>('todos');
    const [editingItemId, setEditingItemId] = useState<string | null>(null);
    const [editedName, setEditedName] = useState('');
    const [deletingItem, setDeletingItem] = useState<StockItem | null>(null);

    const filteredStock = useMemo(() => {
        if (activeFilter === 'todos') {
            return stock;
        }
        if (activeFilter === 'estoque_baixo') {
            return stock.filter(item => 
                item.minAlertQuantity !== undefined && item.quantity <= item.minAlertQuantity
            );
        }
        return stock.filter(item => item.category === activeFilter);
    }, [stock, activeFilter]);

    const handleEditClick = (item: StockItem) => {
        setEditingItemId(item.id);
        setEditedName(item.name);
    };

    const handleCancelEdit = () => {
        setEditingItemId(null);
        setEditedName('');
    };

    const handleSaveEdit = (itemId: string) => {
        if (editedName.trim()) {
            updateProduct(itemId, { name: editedName });
            handleCancelEdit();
        }
    };

    const handleConfirmDelete = () => {
        if (deletingItem) {
            deleteProduct(deletingItem.id);
            setDeletingItem(null);
        }
    };

    const categoryFilters: { id: StockFilter; label: string }[] = [
        { id: 'todos', label: 'Todos' },
        { id: 'material_venda', label: 'Venda' },
        { id: 'material_escritorio', label: 'Escritório' },
        { id: 'material_limpeza', label: 'Limpeza' },
        { id: 'sob_encomenda', label: 'Sob Encomenda' },
        { id: 'estoque_baixo', label: 'Estoque Baixo' },
    ];

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800">Gerenciamento de Estoque</h2>
                <div className="flex gap-2">
                    <button
                        onClick={() => setIsRestockModalOpen(true)}
                        className="bg-green-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-green-700 transition-colors flex items-center"
                    >
                        <Repeat className="h-5 w-5 mr-2" />
                        Repor Estoque
                    </button>
                    <button
                        onClick={() => setIsAddModalOpen(true)}
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-blue-700 transition-colors flex items-center"
                    >
                        <Plus className="h-5 w-5 mr-2" />
                        Adicionar Produto
                    </button>
                </div>
            </div>

            <div className="mb-4 flex items-center flex-wrap gap-2">
                <Tag className="h-5 w-5 text-gray-500" />
                <span className="text-sm font-semibold text-gray-600 mr-2">Filtrar por Categoria:</span>
                {categoryFilters.map(filter => {
                    const isEstoqueBaixo = filter.id === 'estoque_baixo';
                    const isActive = activeFilter === filter.id;
                    
                    let buttonClass = 'bg-gray-200 text-gray-700 hover:bg-gray-300';
                    if (isActive) {
                        buttonClass = isEstoqueBaixo 
                            ? 'bg-red-600 text-white font-semibold shadow' 
                            : 'bg-blue-600 text-white font-semibold shadow';
                    } else if (isEstoqueBaixo) {
                        buttonClass = 'bg-red-100 text-red-700 hover:bg-red-200';
                    }

                    return (
                        <button
                            key={filter.id}
                            onClick={() => setActiveFilter(filter.id)}
                            className={`px-3 py-1 text-xs rounded-full transition-colors flex items-center gap-1.5 ${buttonClass}`}
                        >
                            {isEstoqueBaixo && <AlertTriangle size={12} />}
                            {filter.label}
                        </button>
                    );
                })}
            </div>

            <div className="bg-white rounded-lg shadow-md overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Código</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Produto</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Categoria</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Quantidade</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Alerta Mín.</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Preço de Venda</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Data de Cadastro</th>
                                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {filteredStock.map(item => {
                                const config = categoryConfig[item.category] || defaultConfig;
                                const Icon = config.icon;
                                const isEditing = editingItemId === item.id;
                                const isLowStock = item.minAlertQuantity !== undefined && item.quantity <= item.minAlertQuantity;
                                return (
                                    <tr key={item.id} className={isEditing ? 'bg-yellow-50' : 'hover:bg-gray-50'}>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-mono">{item.trackingCode}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                            {isEditing ? (
                                                <input 
                                                    type="text" 
                                                    value={editedName} 
                                                    onChange={(e) => setEditedName(e.target.value)} 
                                                    className="w-full px-2 py-1 border rounded-md"
                                                    autoFocus
                                                />
                                            ) : (
                                                item.name
                                            )}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 ${config.color}`}>
                                                <Icon className="h-4 w-4 mr-1.5" />
                                                {config.label}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-right">
                                            <div className="flex flex-col items-end">
                                                <span className={`font-semibold ${isLowStock ? 'text-red-600' : 'text-gray-800'}`}>
                                                    {isLowStock && <AlertTriangle className="h-4 w-4 inline mr-1.5" />}
                                                    {item.quantity}
                                                </span>
                                                {item.unitDescription && <span className="text-xs text-gray-400">{item.unitDescription}</span>}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right">
                                            {item.minAlertQuantity ?? 'N/A'}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right">
                                            {item.sellingPrice > 0 ? `R$ ${item.sellingPrice.toFixed(2)}` : 'N/A'}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{format(new Date(item.createdAt), 'dd/MM/yyyy')}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                                            {isEditing ? (
                                                <div className="flex justify-center space-x-2">
                                                    <button onClick={() => handleSaveEdit(item.id)} className="text-green-600 hover:text-green-900" title="Salvar"><Save className="h-5 w-5"/></button>
                                                    <button onClick={handleCancelEdit} className="text-gray-600 hover:text-gray-900" title="Cancelar"><X className="h-5 w-5"/></button>
                                                </div>
                                            ) : (
                                                <div className="flex justify-center space-x-2">
                                                    <button onClick={() => handleEditClick(item)} className="text-indigo-600 hover:text-indigo-900" title="Editar"><Edit className="h-5 w-5"/></button>
                                                    <button onClick={() => setDeletingItem(item)} className="text-red-600 hover:text-red-900" title="Excluir"><Trash2 className="h-5 w-5"/></button>
                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
                {filteredStock.length === 0 && (
                    <p className="text-center text-gray-500 py-12">Nenhum produto encontrado para esta categoria.</p>
                )}
            </div>

            {isAddModalOpen && (
                <AddProductModal 
                    isOpen={isAddModalOpen} 
                    onClose={() => setIsAddModalOpen(false)} 
                />
            )}
            {isRestockModalOpen && (
                <RestockModal 
                    isOpen={isRestockModalOpen} 
                    onClose={() => setIsRestockModalOpen(false)} 
                />
            )}
            {deletingItem && (
                <DeleteConfirmationModal
                    isOpen={!!deletingItem}
                    onClose={() => setDeletingItem(null)}
                    onConfirm={handleConfirmDelete}
                    title="Confirmar Exclusão"
                    message={`Tem certeza que deseja excluir o produto "${deletingItem.name}"? Esta ação não pode ser desfeita.`}
                />
            )}
        </div>
    );
};

export default StockManagement;
