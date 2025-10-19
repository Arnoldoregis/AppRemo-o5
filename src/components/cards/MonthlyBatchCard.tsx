import React, { useState } from 'react';
import { Removal } from '../../types';
import { ChevronDown, ChevronUp, Calendar, Eye } from 'lucide-react';

interface MonthlyBatchCardProps {
    month: string;
    removals: Removal[];
    onSelectRemoval: (removal: Removal) => void;
}

const MonthlyBatchCard: React.FC<MonthlyBatchCardProps> = ({ month, removals, onSelectRemoval }) => {
    const [isOpen, setIsOpen] = useState(false);
    const totalValue = removals.reduce((sum, r) => sum + r.value, 0);

    return (
        <div className="bg-white rounded-lg shadow-md border border-gray-200">
            <div 
                className="p-4 flex justify-between items-center cursor-pointer hover:bg-gray-50"
                onClick={() => setIsOpen(!isOpen)}
            >
                <div className="flex items-center gap-4">
                    <Calendar className="h-6 w-6 text-blue-600" />
                    <div>
                        <h3 className="font-bold text-lg text-gray-800">{month}</h3>
                        <p className="text-sm text-gray-500">{removals.length} remoções</p>
                    </div>
                </div>
                <div className="flex items-center gap-6">
                    <div className="text-right">
                        <p className="text-sm text-gray-500">Valor Total do Lote</p>
                        <p className="font-bold text-green-600">R$ {totalValue.toFixed(2)}</p>
                    </div>
                    <button className="p-2 rounded-full hover:bg-gray-200">
                        {isOpen ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                    </button>
                </div>
            </div>

            {isOpen && (
                <div className="border-t border-gray-200">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Código</th>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Pet</th>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Tutor</th>
                                    <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Valor (R$)</th>
                                    <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase">Ações</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {removals.map(removal => (
                                    <tr key={removal.code} className="hover:bg-gray-50">
                                        <td className="px-4 py-3 text-sm text-gray-800 font-mono">{removal.code}</td>
                                        <td className="px-4 py-3 text-sm text-gray-600">{removal.pet.name}</td>
                                        <td className="px-4 py-3 text-sm text-gray-600">{removal.tutor.name}</td>
                                        <td className="px-4 py-3 text-sm text-gray-800 font-medium text-right">{removal.value.toFixed(2)}</td>
                                        <td className="px-4 py-3 text-center">
                                            <button 
                                                onClick={() => onSelectRemoval(removal)}
                                                className="text-blue-600 hover:text-blue-800 p-1 rounded-full hover:bg-blue-100"
                                                title="Ver detalhes da remoção"
                                            >
                                                <Eye size={18} />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MonthlyBatchCard;
