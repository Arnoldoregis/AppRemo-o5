import React, { useState } from 'react';
import { Removal } from '../../types';
import { ChevronDown, ChevronUp, Calendar, Eye } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface DailyBatchCardProps {
    date: string; // yyyy-MM-dd
    removals: Removal[];
    onSelectRemoval: (removal: Removal) => void;
}

const DailyBatchCard: React.FC<DailyBatchCardProps> = ({ date, removals, onSelectRemoval }) => {
    const [isOpen, setIsOpen] = useState(false);
    
    // Formata a data para exibição (ex: "25 de Outubro de 2025")
    const displayDate = format(new Date(date + 'T00:00:00'), "dd 'de' MMMM 'de' yyyy", { locale: ptBR });
    const weekDay = format(new Date(date + 'T00:00:00'), "EEEE", { locale: ptBR });

    return (
        <div className="bg-white rounded-lg shadow-md border border-gray-200">
            <div 
                className="p-4 flex justify-between items-center cursor-pointer hover:bg-gray-50 transition-colors"
                onClick={() => setIsOpen(!isOpen)}
            >
                <div className="flex items-center gap-4">
                    <div className="bg-blue-100 p-2 rounded-full">
                        <Calendar className="h-6 w-6 text-blue-600" />
                    </div>
                    <div>
                        <h3 className="font-bold text-lg text-gray-800 capitalize">
                            {displayDate}
                        </h3>
                        <p className="text-sm text-gray-500 capitalize">
                            {weekDay} • {removals.length} {removals.length === 1 ? 'remoção' : 'remoções'}
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    <button className="p-2 rounded-full hover:bg-gray-200 text-gray-500">
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
                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Tutor / Clínica</th>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Motorista</th>
                                    <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase">Ações</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {removals.map(removal => (
                                    <tr key={removal.code} className="hover:bg-gray-50">
                                        <td className="px-4 py-3 text-sm text-gray-800 font-mono">{removal.code}</td>
                                        <td className="px-4 py-3 text-sm text-gray-600">{removal.pet.name}</td>
                                        <td className="px-4 py-3 text-sm text-gray-600">
                                            {removal.clinicName ? (
                                                <div>
                                                    <span className="font-medium text-gray-800">{removal.clinicName}</span>
                                                    <div className="text-xs text-gray-500">Tutor: {removal.tutor.name}</div>
                                                </div>
                                            ) : (
                                                removal.tutor.name
                                            )}
                                        </td>
                                        <td className="px-4 py-3 text-sm text-gray-600">
                                            {removal.assignedDriver?.name || 'N/A'}
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            <button 
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    onSelectRemoval(removal);
                                                }}
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

export default DailyBatchCard;
