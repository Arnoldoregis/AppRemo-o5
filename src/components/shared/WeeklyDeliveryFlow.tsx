import React, { useMemo } from 'react';
import { Removal } from '../../types';
import { format, startOfWeek, endOfWeek, isWithinInterval } from 'date-fns';
import { Truck } from 'lucide-react';

interface WeeklyDeliveryFlowProps {
    removals: Removal[];
}

const WeeklyDeliveryFlow: React.FC<WeeklyDeliveryFlowProps> = ({ removals }) => {
    const weeklyDeliveries = useMemo(() => {
        const now = new Date();
        const weekStart = startOfWeek(now, { weekStartsOn: 1 });
        const weekEnd = endOfWeek(now, { weekStartsOn: 1 });

        const deliveries = removals
            .filter(removal => {
                if (removal.status !== 'entrega_agendada' || !removal.scheduledDeliveryDate) {
                    return false;
                }
                const deliveryDate = new Date(removal.scheduledDeliveryDate + 'T00:00:00');
                return isWithinInterval(deliveryDate, { start: weekStart, end: weekEnd });
            })
            .sort((a, b) => new Date(a.scheduledDeliveryDate!).getTime() - new Date(b.scheduledDeliveryDate!).getTime());

        // Group by date for rowspan calculation
        const groupedByDate: { [key: string]: Removal[] } = {};
        deliveries.forEach(d => {
            const dateKey = d.scheduledDeliveryDate!;
            if (!groupedByDate[dateKey]) {
                groupedByDate[dateKey] = [];
            }
            groupedByDate[dateKey].push(d);
        });

        return { deliveries, groupedByDate };
    }, [removals]);

    const { deliveries, groupedByDate } = weeklyDeliveries;

    if (deliveries.length === 0) {
        return (
            <div className="text-center py-12 text-gray-500">
                <Truck size={48} className="mx-auto text-gray-300 mb-4" />
                <p>Nenhuma entrega agendada para esta semana.</p>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Data da Entrega</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nome do Pet</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nome do Tutor</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Código</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Endereço da Entrega</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {deliveries.map((removal) => {
                            const dateKey = removal.scheduledDeliveryDate!;
                            const isFirstOfGroup = groupedByDate[dateKey][0].code === removal.code;
                            const groupSize = groupedByDate[dateKey].length;
                            const address = removal.deliveryAddress || removal.removalAddress;

                            return (
                                <tr key={removal.code} className="hover:bg-gray-50">
                                    {isFirstOfGroup && (
                                        <td rowSpan={groupSize} className="px-6 py-4 align-top border-r whitespace-nowrap text-sm font-semibold text-gray-800">
                                            {format(new Date(dateKey + 'T00:00:00'), "dd/MM/yyyy")}
                                        </td>
                                    )}
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">{removal.pet.name}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{removal.tutor.name}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-mono">{removal.code}</td>
                                    <td className="px-6 py-4 text-sm text-gray-600">{`${address.street}, ${address.number} - ${address.neighborhood}, ${address.city} - ${address.state}, CEP: ${address.cep}`}</td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default WeeklyDeliveryFlow;
