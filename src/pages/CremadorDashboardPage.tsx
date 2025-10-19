import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useRemovals } from '../context/RemovalContext';
import { useAuth } from '../context/AuthContext';
import Layout from '../components/Layout';
import { Plus, Download, ArrowLeft, PlayCircle, CheckCircle, Flame, Box, Send, ClipboardCheck, PackagePlus } from 'lucide-react';
import { format, startOfWeek, endOfWeek, isWithinInterval } from 'date-fns';
import CreateCremationBatchModal from '../components/modals/CreateCremationBatchModal';
import { exportCremationHistoryToExcel } from '../utils/exportToExcel';
import { Removal } from '../types';
import RemovalCard from '../components/RemovalCard';
import RemovalDetailsModal from '../components/RemovalDetailsModal';
import AssembleBagModal from '../components/modals/AssembleBagModal';

type CremadorTab = 'ag_cremacao' | 'liberado_cremacao' | 'montar_sacola' | 'ag_liberacao' | 'liberado_sqp';

const CremadorDashboardPage: React.FC = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const { removals, cremationBatches, startCremationBatch, finishCremationBatch } = useRemovals();
    const [activeTab, setActiveTab] = useState<CremadorTab>('ag_cremacao');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedRemoval, setSelectedRemoval] = useState<Removal | null>(null);
    const [assembleBagModal, setAssembleBagModal] = useState<{ isOpen: boolean; removal: Removal | null }>({ isOpen: false, removal: null });

    // Define que apenas o perfil 'cremador' pode editar.
    const isReadOnly = user?.role !== 'cremador';

    const isDownloadDay = useMemo(() => {
        const day = new Date().getDay(); // 0 (Sun) to 6 (Sat)
        return day >= 1 && day <= 6;
    }, []);

    const handleDownloadWeeklyHistory = () => {
        const now = new Date();
        const weekStart = startOfWeek(now, { weekStartsOn: 1 });
        const weekEnd = endOfWeek(now, { weekStartsOn: 1 });

        const weeklyBatches = cremationBatches.filter(batch => 
            batch.finishedAt && isWithinInterval(new Date(batch.finishedAt), { start: weekStart, end: weekEnd })
        );
        
        exportCremationHistoryToExcel(weeklyBatches, `historico_cremacao_semanal_${format(now, 'yyyy-MM-dd')}`);
    };

    const filteredRemovals = useMemo(() => {
        switch (activeTab) {
            case 'liberado_cremacao':
                return removals.filter(r => r.status === 'finalizada' && r.modality.includes('individual'));
            case 'montar_sacola':
                return removals.filter(r => r.status === 'cremado' && r.modality.includes('individual'));
            case 'ag_liberacao':
                return removals.filter(r => r.status === 'aguardando_financeiro_junior' && r.modality === 'coletivo');
            case 'liberado_sqp':
                return removals.filter(r => r.status === 'aguardando_baixa_master' && r.cremationCompany === 'SQP');
            default:
                return [];
        }
    }, [activeTab, removals]);

    const tabs: { id: CremadorTab; label: string; icon: React.ElementType }[] = [
        { id: 'ag_cremacao', label: 'AG Cremação (Lotes)', icon: Flame },
        { id: 'liberado_cremacao', label: 'Liberado Cremação', icon: ClipboardCheck },
        { id: 'montar_sacola', label: 'Montar Sacola', icon: PackagePlus },
        { id: 'ag_liberacao', label: 'AG Liberação (Coletivas)', icon: Box },
        { id: 'liberado_sqp', label: 'Liberado SQP', icon: Send },
    ];

    const handleCardClick = (removal: Removal) => {
        if (activeTab === 'montar_sacola' && !isReadOnly) {
            setAssembleBagModal({ isOpen: true, removal: removal });
        } else {
            setSelectedRemoval(removal);
        }
    };

    return (
        <Layout title="Painel do Cremador">
            <div className="mb-6">
                <button onClick={() => navigate(-1)} className="flex items-center text-blue-600 hover:text-blue-800 font-semibold">
                    <ArrowLeft className="h-5 w-5 mr-2" />
                    Voltar
                </button>
            </div>

            <div className="bg-white rounded-lg shadow-md">
                <div className="border-b">
                    <nav className="flex flex-wrap -mb-px">
                        {tabs.map(tab => (
                            <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`px-4 py-3 font-medium text-sm border-b-2 flex items-center gap-2 ${activeTab === tab.id ? 'border-orange-500 text-orange-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
                                <tab.icon size={16} /> {tab.label}
                            </button>
                        ))}
                    </nav>
                </div>

                <div className="p-6">
                    {activeTab === 'ag_cremacao' && (
                        <div>
                            <div className="flex justify-end items-center gap-2 mb-4">
                                {isDownloadDay && (
                                    <button onClick={handleDownloadWeeklyHistory} className="bg-green-600 text-white px-4 py-2 rounded-lg flex items-center hover:bg-green-700 transition-colors text-sm">
                                        <Download className="h-4 w-4 mr-2" /> Baixar Histórico Semanal
                                    </button>
                                )}
                                <button onClick={() => setIsModalOpen(true)} disabled={isReadOnly} className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center hover:bg-blue-700 transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed">
                                    <Plus className="h-4 w-4 mr-2" /> Adicionar Cremação
                                </button>
                            </div>
                            <div className="overflow-x-auto border rounded-lg">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Lote</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Itens</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Início</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fim</th>
                                            <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Ações</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {cremationBatches.map(batch => (
                                            <tr key={batch.id}>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="text-sm font-medium text-gray-900">{batch.id}</div>
                                                    <div className="text-xs text-gray-500">Criado em: {format(new Date(batch.createdAt), 'dd/MM/yy HH:mm')}</div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <ul className="text-xs space-y-1">
                                                        {batch.items.map(item => (
                                                            <li key={item.removalCode}>{item.petName} ({item.removalCode}) - <strong>{item.position}</strong></li>
                                                        ))}
                                                    </ul>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{batch.startedAt ? format(new Date(batch.startedAt), 'dd/MM/yy HH:mm') : 'Aguardando'}</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{batch.finishedAt ? format(new Date(batch.finishedAt), 'dd/MM/yy HH:mm') : 'Aguardando'}</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium space-x-2">
                                                    {!batch.startedAt && <button onClick={() => user && startCremationBatch(batch.id, user.name)} disabled={isReadOnly} className="text-blue-600 hover:text-blue-900 flex items-center gap-1 mx-auto disabled:opacity-50 disabled:cursor-not-allowed" title="Iniciar Cremação"><PlayCircle size={16}/> Iniciar</button>}
                                                    {batch.startedAt && !batch.finishedAt && <button onClick={() => user && finishCremationBatch(batch.id, user.name)} disabled={isReadOnly} className="text-green-600 hover:text-green-900 flex items-center gap-1 mx-auto disabled:opacity-50 disabled:cursor-not-allowed" title="Finalizar Cremação"><CheckCircle size={16}/> Finalizar</button>}
                                                    {batch.finishedAt && <span className="text-gray-400">Concluído</span>}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                                {cremationBatches.length === 0 && <p className="text-center text-gray-500 py-12">Nenhum lote de cremação criado.</p>}
                            </div>
                        </div>
                    )}
                    {activeTab !== 'ag_cremacao' && (
                        filteredRemovals.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {filteredRemovals.map(removal => <RemovalCard key={removal.code} removal={removal} onClick={() => handleCardClick(removal)} />)}
                            </div>
                        ) : (
                            <p className="text-center text-gray-500 py-12">Nenhuma remoção nesta categoria.</p>
                        )
                    )}
                </div>
            </div>

            {isModalOpen && <CreateCremationBatchModal onClose={() => setIsModalOpen(false)} operatorName={user?.name || 'Desconhecido'} />}
            <RemovalDetailsModal removal={selectedRemoval} onClose={() => setSelectedRemoval(null)} isReadOnly={isReadOnly} />
            {assembleBagModal.isOpen && assembleBagModal.removal && (
                <AssembleBagModal
                    isOpen={assembleBagModal.isOpen}
                    onClose={() => setAssembleBagModal({ isOpen: false, removal: null })}
                    removal={assembleBagModal.removal}
                />
            )}
        </Layout>
    );
};

export default CremadorDashboardPage;
