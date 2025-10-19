import React from 'react';
import { Removal } from '../../types';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { UserCheck, Eye } from 'lucide-react';

interface AwaitingPickupListProps {
    removals: Removal[];
    onSelectRemoval: (removal: Removal) => void;
    title: string;
    isFinalizedList?: boolean;
}

const AwaitingPickupList: React.FC<AwaitingPickupListProps> = ({ removals, onSelectRemoval, title, isFinalizedList }) => {
    if (removals.length === 0) {
        return (
            <div className="text-center py-12 text-gray-500">
                <UserCheck size={48} className="mx-auto text-gray-300 mb-4" />
                <p>Nenhuma remoção nesta categoria.</p>
            </div>
        );
    }

    const getRelevantDate = (removal: Removal): string => {
        const historyAction = isFinalizedList ? 'finalizada por' : 'marcou que o tutor virá buscar';
        const historyEntry = [...removal.history].reverse().find(h => h.action.includes(historyAction));
        return historyEntry ? format(new Date(historyEntry.date), "dd/MM/yyyy HH:mm", { locale: ptBR }) : 'N/A';
    };

    return (
        <div className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden">
            {title && <h3 className="text-lg font-bold text-gray-800 p-4 bg-gray-50 border-b">{title}</h3>}
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">{isFinalizedList ? 'Data Finalização' : 'Data Agendamento'}</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Código</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Pet / Tutor</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Contato</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Produtos</th>
                            {!isFinalizedList && <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase">Ações</th>}
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {removals.map((removal) => (
                            <tr key={removal.code} className="hover:bg-gray-50">
                                <td className="px-4 py-3 whitespace-nowrap text-sm font-semibold text-gray-800">{getRelevantDate(removal)}</td>
                                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 font-mono">{removal.code}</td>
                                <td className="px-4 py-3">
                                    <p className="text-sm font-semibold text-gray-800">{removal.pet.name}</p>
                                    <p className="text-xs text-gray-600">{removal.tutor.name}</p>
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">{removal.tutor.phone}</td>
                                <td className="px-4 py-3 text-sm text-gray-600">
                                    {removal.deliveryItems && removal.deliveryItems.length > 0 ? (
                                        <ul className="list-disc list-inside text-xs space-y-1">
                                            {removal.deliveryItems.map(item => <li key={item}>{item}</li>)}
                                        </ul>
                                    ) : (
                                        <span className="text-gray-400">N/A</span>
                                    )}
                                </td>
                                {!isFinalizedList && (
                                    <td className="px-4 py-3 text-center">
                                        <button onClick={() => onSelectRemoval(removal)} className="text-blue-600 hover:text-blue-800 p-1 rounded-full hover:bg-blue-100" title="Ver detalhes e confirmar retirada">
                                            <Eye size={18} />
                                        </button>
                                    </td>
                                )}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default AwaitingPickupList;
