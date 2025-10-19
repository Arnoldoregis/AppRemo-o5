import React, { useState, useMemo } from 'react';
import { useRemovals } from '../../context/RemovalContext';
import { format, getMonth, getYear } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface MonthlyStats {
    totalFaturado: number;
    preventivePlansCount: number;
    preventivePlansValue: number;
    immediatePlans: {
        coletivo: { quantity: number; value: number };
        individual_prata: { quantity: number; value: number };
        individual_ouro: { quantity: number; value: number };
        total: { quantity: number; value: number };
    };
}

const CompareMonths: React.FC = () => {
    const { removals } = useRemovals();

    const availableMonths = useMemo(() => {
        const monthSet = new Set<string>();
        removals.forEach(r => {
            const date = new Date(r.createdAt);
            monthSet.add(format(date, 'yyyy-MM'));
        });
        return Array.from(monthSet).sort().reverse();
    }, [removals]);

    const [month1, setMonth1] = useState<string>(availableMonths[1] || '');
    const [month2, setMonth2] = useState<string>(availableMonths[0] || '');

    const calculateDataForMonth = (monthYear: string): MonthlyStats | null => {
        if (!monthYear) return null;
        const [year, month] = monthYear.split('-').map(Number);

        const monthRemovals = removals.filter(r => {
            const d = new Date(r.createdAt);
            return getYear(d) === year && getMonth(d) + 1 === month && r.status !== 'cancelada';
        });

        const preventivePlans = monthRemovals.filter(r => r.paymentMethod === 'plano_preventivo');
        const immediatePlans = monthRemovals.filter(r => r.paymentMethod !== 'plano_preventivo');

        const immediateColetivo = immediatePlans.filter(r => r.modality === 'coletivo');
        const immediatePrata = immediatePlans.filter(r => r.modality === 'individual_prata');
        const immediateOuro = immediatePlans.filter(r => r.modality === 'individual_ouro');

        return {
            totalFaturado: monthRemovals.reduce((sum, r) => sum + r.value, 0),
            preventivePlansCount: preventivePlans.length,
            preventivePlansValue: preventivePlans.reduce((sum, r) => sum + r.value, 0),
            immediatePlans: {
                coletivo: {
                    quantity: immediateColetivo.length,
                    value: immediateColetivo.reduce((sum, r) => sum + r.value, 0),
                },
                individual_prata: {
                    quantity: immediatePrata.length,
                    value: immediatePrata.reduce((sum, r) => sum + r.value, 0),
                },
                individual_ouro: {
                    quantity: immediateOuro.length,
                    value: immediateOuro.reduce((sum, r) => sum + r.value, 0),
                },
                total: {
                    quantity: immediatePlans.length,
                    value: immediatePlans.reduce((sum, r) => sum + r.value, 0),
                }
            }
        };
    };

    const data1 = useMemo(() => calculateDataForMonth(month1), [month1, removals]);
    const data2 = useMemo(() => calculateDataForMonth(month2), [month2, removals]);

    const renderVariation = (val1: number, val2: number, isCurrency = false) => {
        if (val1 === 0 && val2 === 0) return <Minus className="h-5 w-5 text-gray-400 mx-auto" />;
        if (val1 === 0) return <span className="text-green-600 font-bold">Novo</span>;
        
        const variation = ((val2 - val1) / val1) * 100;
        const color = variation >= 0 ? 'text-green-600' : 'text-red-600';
        const Icon = variation >= 0 ? TrendingUp : TrendingDown;
        
        return (
            <span className={`flex items-center justify-center gap-1 font-semibold ${color}`}>
                <Icon className="h-4 w-4" />
                {variation.toFixed(1)}%
            </span>
        );
    };

    const formatMonthLabel = (monthYear: string) => {
        if (!monthYear) return '';
        const [year, month] = monthYear.split('-');
        const date = new Date(Number(year), Number(month) - 1);
        const formatted = format(date, 'MMMM/yyyy', { locale: ptBR });
        return formatted.charAt(0).toUpperCase() + formatted.slice(1);
    };

    return (
        <div>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8 p-4 bg-gray-50 rounded-lg border">
                <div>
                    <label htmlFor="month1" className="text-sm font-medium text-gray-700 mr-2">Comparar:</label>
                    <select id="month1" value={month1} onChange={e => setMonth1(e.target.value)} className="p-2 border rounded-md">
                        {availableMonths.map(m => <option key={m} value={m}>{formatMonthLabel(m)}</option>)}
                    </select>
                </div>
                <div className="font-semibold text-gray-500">com</div>
                <div>
                    <label htmlFor="month2" className="text-sm font-medium text-gray-700 mr-2">Mês:</label>
                    <select id="month2" value={month2} onChange={e => setMonth2(e.target.value)} className="p-2 border rounded-md">
                        {availableMonths.map(m => <option key={m} value={m}>{formatMonthLabel(m)}</option>)}
                    </select>
                </div>
            </div>

            {!data1 || !data2 ? (
                <p className="text-center text-gray-500">Selecione dois meses para comparar.</p>
            ) : (
                <div className="space-y-8">
                    {/* Tabela de Comparação Geral */}
                    <div className="bg-white p-4 rounded-lg border">
                        <h3 className="text-lg font-semibold mb-4">Comparativo Geral</h3>
                        <table className="w-full">
                            <thead>
                                <tr className="border-b-2">
                                    <th className="text-left text-sm font-medium text-gray-600 pb-2">Métrica</th>
                                    <th className="text-center text-sm font-medium text-gray-600 pb-2">{formatMonthLabel(month1)}</th>
                                    <th className="text-center text-sm font-medium text-gray-600 pb-2">{formatMonthLabel(month2)}</th>
                                    <th className="text-center text-sm font-medium text-gray-600 pb-2">Variação</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr className="border-b">
                                    <td className="py-3 font-medium">Valor Total Faturado</td>
                                    <td className="py-3 text-center">R$ {data1.totalFaturado.toFixed(2)}</td>
                                    <td className="py-3 text-center">R$ {data2.totalFaturado.toFixed(2)}</td>
                                    <td className="py-3 text-center">{renderVariation(data1.totalFaturado, data2.totalFaturado, true)}</td>
                                </tr>
                                <tr className="border-b">
                                    <td className="py-3 font-medium">Planos Preventivos (Qtd)</td>
                                    <td className="py-3 text-center">{data1.preventivePlansCount}</td>
                                    <td className="py-3 text-center">{data2.preventivePlansCount}</td>
                                    <td className="py-3 text-center">{renderVariation(data1.preventivePlansCount, data2.preventivePlansCount)}</td>
                                </tr>
                                <tr>
                                    <td className="py-3 font-medium">Planos Preventivos (Valor)</td>
                                    <td className="py-3 text-center">R$ {data1.preventivePlansValue.toFixed(2)}</td>
                                    <td className="py-3 text-center">R$ {data2.preventivePlansValue.toFixed(2)}</td>
                                    <td className="py-3 text-center">{renderVariation(data1.preventivePlansValue, data2.preventivePlansValue, true)}</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>

                    {/* Tabela de Desempenho por Modalidade */}
                    <div className="bg-white p-4 rounded-lg border">
                        <h3 className="text-lg font-semibold mb-4">Desempenho por Modalidade (Imediato)</h3>
                        <table className="w-full">
                            <thead>
                                <tr className="border-b-2">
                                    <th rowSpan={2} className="text-left align-bottom text-sm font-medium text-gray-600 pb-2">Modalidade</th>
                                    <th colSpan={2} className="text-center text-sm font-medium text-gray-600 pb-1 border-b">{formatMonthLabel(month1)}</th>
                                    <th colSpan={2} className="text-center text-sm font-medium text-gray-600 pb-1 border-b">{formatMonthLabel(month2)}</th>
                                </tr>
                                <tr className="border-b">
                                    <th className="text-center text-xs font-medium text-gray-500 py-1">Qtd</th>
                                    <th className="text-center text-xs font-medium text-gray-500 py-1">Valor</th>
                                    <th className="text-center text-xs font-medium text-gray-500 py-1">Qtd</th>
                                    <th className="text-center text-xs font-medium text-gray-500 py-1">Valor</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr className="border-b">
                                    <td className="py-3 font-medium">Coletivo</td>
                                    <td className="py-3 text-center">{data1.immediatePlans.coletivo.quantity}</td>
                                    <td className="py-3 text-center">R$ {data1.immediatePlans.coletivo.value.toFixed(2)}</td>
                                    <td className="py-3 text-center">{data2.immediatePlans.coletivo.quantity}</td>
                                    <td className="py-3 text-center">R$ {data2.immediatePlans.coletivo.value.toFixed(2)}</td>
                                </tr>
                                <tr className="border-b">
                                    <td className="py-3 font-medium">Individual Prata</td>
                                    <td className="py-3 text-center">{data1.immediatePlans.individual_prata.quantity}</td>
                                    <td className="py-3 text-center">R$ {data1.immediatePlans.individual_prata.value.toFixed(2)}</td>
                                    <td className="py-3 text-center">{data2.immediatePlans.individual_prata.quantity}</td>
                                    <td className="py-3 text-center">R$ {data2.immediatePlans.individual_prata.value.toFixed(2)}</td>
                                </tr>
                                <tr className="border-b">
                                    <td className="py-3 font-medium">Individual Ouro</td>
                                    <td className="py-3 text-center">{data1.immediatePlans.individual_ouro.quantity}</td>
                                    <td className="py-3 text-center">R$ {data1.immediatePlans.individual_ouro.value.toFixed(2)}</td>
                                    <td className="py-3 text-center">{data2.immediatePlans.individual_ouro.quantity}</td>
                                    <td className="py-3 text-center">R$ {data2.immediatePlans.individual_ouro.value.toFixed(2)}</td>
                                </tr>
                                <tr className="bg-gray-50 font-bold">
                                    <td className="py-3">Total Imediato</td>
                                    <td className="py-3 text-center">{data1.immediatePlans.total.quantity}</td>
                                    <td className="py-3 text-center">R$ {data1.immediatePlans.total.value.toFixed(2)}</td>
                                    <td className="py-3 text-center">{data2.immediatePlans.total.quantity}</td>
                                    <td className="py-3 text-center">R$ {data2.immediatePlans.total.value.toFixed(2)}</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CompareMonths;
