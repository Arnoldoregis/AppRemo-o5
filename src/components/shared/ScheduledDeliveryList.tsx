import React, { useMemo, useState } from 'react';
import { Removal } from '../../types';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Trash2, Download, CheckCircle, Calendar, Truck, Undo } from 'lucide-react';
import ConfirmDeliveryModal from '../modals/ConfirmDeliveryModal';
import { generateDeliveryReportPdf } from '../../utils/generateDeliveryReportPdf';

interface ScheduledDeliveryListProps {
    removals: Removal[];
    onCancelDelivery: (removalCode: string) => void;
    onMarkAsDelivered: (removalId: string, deliveryPerson: string) => void;
    onReturnToSchedule: (removalId: string) => void;
}

const ScheduledDeliveryList: React.FC<ScheduledDeliveryListProps> = ({ removals, onCancelDelivery, onMarkAsDelivered, onReturnToSchedule }) => {
    const [confirmingDelivery, setConfirmingDelivery] = useState<Removal | null>(null);

    const deliveriesByDate = useMemo(() => {
        const grouped: { [key: string]: Removal[] } = {};
        removals.forEach(removal => {
            const dateKey = removal.scheduledDeliveryDate;
            if (!dateKey) return;
            if (!grouped[dateKey]) { grouped[dateKey] = []; }
            grouped[dateKey].push(removal);
        });
        return Object.entries(grouped).sort(([dateA], [dateB]) => new Date(dateA).getTime() - new Date(dateB).getTime());
    }, [removals]);

    if (removals.length === 0) {
        return (
            <div className="text-center py-12 text-gray-500">
                <Truck size={48} className="mx-auto text-gray-300 mb-4" />
                <p>Nenhuma entrega agendada encontrada.</p>
            </div>
        );
    }

    return (
        <>
            <div className="space-y-8">
                {deliveriesByDate.map(([date, removalsForDate]) => (
                    <div key={date} className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden">
                        <div className="p-4 bg-gray-50 border-b flex justify-between items-center">
                            <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                                <Calendar size={20} className="text-blue-600" />
                                {format(new Date(date + 'T00:00:00'), "EEEE, dd 'de' MMMM", { locale: ptBR })}
                            </h3>
                            <button
                                onClick={() => generateDeliveryReportPdf(date, removalsForDate)}
                                className="flex items-center gap-2 text-sm bg-blue-100 text-blue-700 px-3 py-1.5 rounded-md hover:bg-blue-200 font-semibold"
                            >
                                <Download size={14} />
                                Baixar Relatório do Dia
                            </button>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="min-w-full">
                                <thead className="bg-white">
                                    <tr>
                                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Código</th>
                                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Pet / Tutor</th>
                                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Endereço / Contato</th>
                                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Produtos</th>
                                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Entregador</th>
                                        <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase">Ações</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {removalsForDate.map((removal) => {
                                        const address = removal.deliveryAddress || removal.removalAddress;
                                        const fullAddress = `${address.street}, ${address.number}, ${address.neighborhood}, ${address.city} - ${address.state}`;
                                        return (
                                            <tr key={removal.id} className="hover:bg-gray-50">
                                                <td className="px-4 py-3 align-top whitespace-nowrap text-sm text-gray-500 font-mono">{removal.code}</td>
                                                <td className="px-4 py-3 align-top">
                                                    <p className="text-sm font-semibold text-gray-800">{removal.pet.name}</p>
                                                    <p className="text-xs text-gray-600">{removal.tutor.name}</p>
                                                </td>
                                                <td className="px-4 py-3 align-top">
                                                    <p className="text-sm text-gray-700 max-w-xs">{fullAddress}</p>
                                                    <p className="text-xs text-gray-500 mt-1">{removal.tutor.phone}</p>
                                                </td>
                                                <td className="px-4 py-3 align-top text-sm text-gray-600">
                                                    {removal.deliveryItems && removal.deliveryItems.length > 0 ? (
                                                        <ul className="list-disc list-inside text-xs space-y-1">
                                                            {removal.deliveryItems.map(item => <li key={item}>{item}</li>)}
                                                        </ul>
                                                    ) : <span className="text-gray-400">N/A</span>}
                                                </td>
                                                <td className="px-4 py-3 align-top whitespace-nowrap text-sm text-gray-800 font-medium">{removal.deliveryPerson || 'N/A'}</td>
                                                <td className="px-4 py-3 align-top whitespace-nowrap text-center">
                                                    <div className="flex items-center justify-center gap-3">
                                                        <button onClick={() => setConfirmingDelivery(removal)} className="text-green-500 hover:text-green-700 p-1" title="Marcar como entregue"><CheckCircle size={18} /></button>
                                                        <button onClick={() => onReturnToSchedule(removal.id)} className="text-yellow-500 hover:text-yellow-700 p-1" title="Retornar para agendamento"><Undo size={18} /></button>
                                                        <button onClick={() => onCancelDelivery(removal.code)} className="text-red-500 hover:text-red-700 p-1" title="Cancelar agendamento"><Trash2 size={18} /></button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                ))}
            </div>
            <ConfirmDeliveryModal
                isOpen={!!confirmingDelivery}
                onClose={() => setConfirmingDelivery(null)}
                onConfirm={(deliveryPerson) => {
                    if (confirmingDelivery) {
                        onMarkAsDelivered(confirmingDelivery.id, deliveryPerson);
                    }
                }}
                removal={confirmingDelivery}
            />
        </>
    );
};

export default ScheduledDeliveryList;
