import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useRemovals } from '../context/RemovalContext';
import { useAgenda } from '../context/AgendaContext';
import Layout from '../components/Layout';
import { Search, Download, List, Package, CalendarDays, Flame, HeartHandshake, PackagePlus, ClipboardCheck } from 'lucide-react';
import { Removal } from '../types';
import RemovalCard from '../components/RemovalCard';
import RemovalDetailsModal from '../components/RemovalDetailsModal';
import { exportToExcel } from '../utils/exportToExcel';

interface OperacionalHomeProps {
    isReadOnly?: boolean;
    viewedRole?: string;
}

const OperacionalHome: React.FC<OperacionalHomeProps> = ({ isReadOnly = false, viewedRole = 'operacional' }) => {
    const { removals } = useRemovals();
    const { schedule } = useAgenda();
    const navigate = useNavigate();
    const [selectedRemoval, setSelectedRemoval] = useState<Removal | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [activeTab, setActiveTab] = useState<'pendentes' | 'coletivos' | 'aguardando_liberacao' | 'com_despedida' | 'coletivo_lembrancinha' | 'lembrancinha_feita'>('pendentes');

    useEffect(() => {
        if (selectedRemoval) {
          const updatedVersion = removals.find(r => r.code === selectedRemoval.code);
          if (updatedVersion) {
            setSelectedRemoval(updatedVersion);
          }
        }
    }, [removals, selectedRemoval?.code]);

    const filteredRemovals = useMemo(() => {
        let baseRemovals: Removal[];
        const scheduledCodes = Object.values(schedule).map(r => r.code);

        switch (activeTab) {
            case 'pendentes':
                baseRemovals = removals.filter(r => r.status === 'concluida' && r.modality.includes('individual'));
                break;
            case 'coletivos':
                baseRemovals = removals.filter(r => r.status === 'concluida' && r.modality === 'coletivo');
                break;
            case 'aguardando_liberacao':
                baseRemovals = removals.filter(r => 
                    r.status === 'aguardando_baixa_master' && 
                    r.modality.includes('individual') && 
                    !scheduledCodes.includes(r.code)
                );
                break;
            case 'com_despedida':
                baseRemovals = removals.filter(r => r.status === 'aguardando_baixa_master' && scheduledCodes.includes(r.code));
                break;
            case 'coletivo_lembrancinha':
                baseRemovals = removals.filter(r => r.status === 'aguardando_producao_adicionais');
                break;
            case 'lembrancinha_feita':
                baseRemovals = removals.filter(r => r.status === 'lembrancinha_feita');
                break;
            default:
                baseRemovals = [];
        }

        if (searchTerm) {
            const lowerCaseSearch = searchTerm.toLowerCase();
            return baseRemovals.filter(r =>
                r.code.toLowerCase().includes(lowerCaseSearch) ||
                r.pet.name.toLowerCase().includes(lowerCaseSearch) ||
                r.tutor.name.toLowerCase().includes(lowerCaseSearch)
            );
        }
        return baseRemovals;
    }, [removals, activeTab, searchTerm, schedule]);

    const handleDownload = () => {
        exportToExcel(filteredRemovals, `historico_operacional_${activeTab}`);
    };

    const tabs = [
        { id: 'pendentes' as const, label: 'Pendentes Individuais', icon: List },
        { id: 'coletivos' as const, label: 'Pendentes Coletivos', icon: Package },
        { id: 'aguardando_liberacao' as const, label: 'Aguardando Liberação', icon: Flame },
        { id: 'com_despedida' as const, label: 'Com Despedida', icon: HeartHandshake },
        { id: 'coletivo_lembrancinha' as const, label: 'Coletivo com Lembrancinha', icon: PackagePlus },
        { id: 'lembrancinha_feita' as const, label: 'Lembrancinha Feita', icon: ClipboardCheck },
    ];

    return (
        <Layout title="Dashboard Operacional">
            <div className="flex justify-between items-center mb-6">
                <div className="relative w-full max-w-xs">
                    <input 
                        type="text" 
                        placeholder="Pesquisar por código, pet, tutor..." 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border rounded-lg" 
                    />
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                </div>
                <div className="flex items-center gap-2">
                    <button 
                        onClick={() => navigate('/painel-cremador')}
                        className="bg-orange-600 text-white px-4 py-2 rounded-lg flex items-center hover:bg-orange-700 transition-colors"
                    >
                        <Flame className="h-5 w-5 mr-2" />
                        Painel do Cremador
                    </button>
                    <button 
                        onClick={() => navigate('/agenda-despedida')}
                        className="bg-purple-600 text-white px-4 py-2 rounded-lg flex items-center hover:bg-purple-700 transition-colors"
                    >
                        <CalendarDays className="h-5 w-5 mr-2" />
                        Agenda de Despedida
                    </button>
                    <button 
                        onClick={handleDownload}
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center"
                    >
                        <Download className="h-5 w-5 mr-2" />
                        Baixar Histórico
                    </button>
                </div>
            </div>

            <div className="bg-white rounded-lg shadow-md">
                <div className="border-b">
                    <nav className="flex flex-wrap -mb-px">
                        {tabs.map(tab => (
                            <button 
                                key={tab.id} 
                                onClick={() => setActiveTab(tab.id)} 
                                className={`px-4 py-3 font-medium text-sm border-b-2 flex items-center gap-2 ${activeTab === tab.id ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                            >
                                <tab.icon size={16} />
                                {tab.label}
                            </button>
                        ))}
                    </nav>
                </div>
                <div className="p-6">
                    {filteredRemovals.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {filteredRemovals.map(removal => 
                                <RemovalCard key={removal.code} removal={removal} onClick={() => setSelectedRemoval(removal)} />
                            )}
                        </div>
                    ) : (
                        <p className="text-center text-gray-500 py-12">Nenhuma remoção nesta categoria.</p>
                    )}
                </div>
            </div>
            <RemovalDetailsModal removal={selectedRemoval} onClose={() => setSelectedRemoval(null)} isReadOnly={isReadOnly} viewedRole={viewedRole} />
        </Layout>
    );
};

export default OperacionalHome;
