import React, { useState, useMemo, useEffect } from 'react';
import { useRemovals } from '../context/RemovalContext';
import { useAuth } from '../context/AuthContext';
import Layout from '../components/Layout';
import { Download, Search, Filter } from 'lucide-react';
import { Removal, LoteFaturamento } from '../types';
import RemovalCard from '../components/RemovalCard';
import RemovalDetailsModal from '../components/RemovalDetailsModal';
import FaturamentoCard from '../components/cards/FaturamentoCard';
import FaturamentoModal from '../components/modals/FaturamentoModal';
import { exportToExcel } from '../utils/exportToExcel';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import MonthlyBatchCard from '../components/cards/MonthlyBatchCard';
import StockManagement from '../components/master/StockManagement';
import PricingManagement from '../components/master/PricingManagement';

type MasterTab = 'remocao_solicitada' | 'dar_baixa' | 'faturado_mensal' | 'finalizada' | 'estoque' | 'planos';

interface FinanceiroMasterHomeProps {
  isReadOnly?: boolean;
  viewedRole?: string;
}

const FinanceiroMasterHome: React.FC<FinanceiroMasterHomeProps> = ({ isReadOnly = false, viewedRole = 'financeiro_master' }) => {
  const { removals } = useRemovals();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<MasterTab>('remocao_solicitada');
  const [selectedRemoval, setSelectedRemoval] = useState<Removal | null>(null);
  const [selectedLote, setSelectedLote] = useState<LoteFaturamento | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [finalizadasFilter, setFinalizadasFilter] = useState<'nao_faturado' | 'faturado'>('nao_faturado');

  useEffect(() => {
    if (selectedRemoval) {
      const updatedVersion = removals.find(r => r.code === selectedRemoval.code);
      if (updatedVersion) setSelectedRemoval(updatedVersion);
    }
  }, [removals, selectedRemoval?.code]);

  useEffect(() => {
    if (activeTab !== 'finalizada') {
      setFinalizadasFilter('nao_faturado');
    }
  }, [activeTab]);

  // Helper para filtrar visualização
  const shouldShowRemoval = (r: Removal) => {
    if (!user) return false;
    // Se o usuário logado é Financeiro Master, ele vê apenas o que está atribuído a ele ou o que não tem atribuição (pool geral)
    if (user.role === 'financeiro_master') {
        return !r.assignedFinanceiroMaster || r.assignedFinanceiroMaster.id === user.id;
    }
    // Se for Financeiro Junior (ou outro com permissão) acessando o painel Master,
    // vê todas as remoções que estão no estágio do Master.
    return true;
  };

  const faturamentoLotesPorMes = useMemo(() => {
    if (!user) return [];
    
    const removalsToGroup = removals.filter(r => 
        r.paymentMethod === 'faturado' && 
        r.status === 'aguardando_baixa_master' &&
        shouldShowRemoval(r)
    );

    const removalsByMonth: { [month: string]: Removal[] } = {};
    removalsToGroup.forEach(r => {
        const monthYear = format(new Date(r.createdAt), 'MMMM yyyy', { locale: ptBR });
        const capitalizedMonthYear = monthYear.charAt(0).toUpperCase() + monthYear.slice(1);
        if (!removalsByMonth[capitalizedMonthYear]) {
            removalsByMonth[capitalizedMonthYear] = [];
        }
        removalsByMonth[capitalizedMonthYear].push(r);
    });

    const monthlyLotes = Object.entries(removalsByMonth).map(([month, monthRemovals]) => {
        const lotesByClinic: { [clinicId: string]: LoteFaturamento } = {};
        monthRemovals.forEach(r => {
            if (r.createdById && r.clinicName) {
                if (!lotesByClinic[r.createdById]) {
                    lotesByClinic[r.createdById] = {
                        id: `${r.createdById}-${month}`,
                        clinicId: r.createdById,
                        clinicName: r.clinicName,
                        removals: [],
                        totalValue: 0,
                        status: 'aguardando_geracao_boleto'
                    };
                }
                lotesByClinic[r.createdById].removals.push(r);
                lotesByClinic[r.createdById].totalValue += r.value;
            }
        });
        return { month, lotes: Object.values(lotesByClinic) };
    });

    return monthlyLotes.sort((a, b) => {
        if (a.lotes.length === 0) return 1;
        if (b.lotes.length === 0) return -1;
        const dateA = new Date(a.lotes[0].removals[0].createdAt);
        const dateB = new Date(b.lotes[0].removals[0].createdAt);
        return dateB.getTime() - dateA.getTime();
    });
  }, [removals, user]);

  const filteredRemovals = useMemo(() => {
    if (!user) return [];
    let baseRemovals: Removal[] = [];
    switch(activeTab) {
      case 'remocao_solicitada':
        baseRemovals = removals.filter(r => 
          r.status === 'encaminhado_master' &&
          shouldShowRemoval(r)
        );
        break;
      case 'dar_baixa':
        baseRemovals = removals.filter(r => 
          r.status === 'aguardando_baixa_master' && 
          r.paymentMethod !== 'faturado' &&
          shouldShowRemoval(r)
        );
        break;
      default:
        baseRemovals = [];
    }

    if (searchTerm) {
        const lowerCaseSearch = searchTerm.toLowerCase();
        return baseRemovals.filter(r =>
            r.tutor.name.toLowerCase().includes(lowerCaseSearch) ||
            r.pet.name.toLowerCase().includes(lowerCaseSearch) ||
            r.code.toLowerCase().includes(lowerCaseSearch)
        );
    }
    return baseRemovals;

  }, [activeTab, removals, searchTerm, user]);
  
  const finalizadasContent = useMemo(() => {
    if (activeTab !== 'finalizada' || !user) return null;

    const baseFinalizadas = removals.filter(r => 
      r.status === 'finalizada' &&
      shouldShowRemoval(r)
    );

    const searchedFinalizadas = searchTerm 
        ? baseFinalizadas.filter(r =>
            r.tutor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            r.pet.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            r.code.toLowerCase().includes(searchTerm.toLowerCase())
        )
        : baseFinalizadas;

    if (finalizadasFilter === 'nao_faturado') {
        const naoFaturadoRemovals = searchedFinalizadas.filter(r => r.paymentMethod !== 'faturado');
        const grouped = naoFaturadoRemovals.reduce((acc, removal) => {
            const monthYear = format(new Date(removal.createdAt), 'MMMM yyyy', { locale: ptBR });
            const capitalizedMonthYear = monthYear.charAt(0).toUpperCase() + monthYear.slice(1);
            if (!acc[capitalizedMonthYear]) {
                acc[capitalizedMonthYear] = [];
            }
            acc[capitalizedMonthYear].push(removal);
            return acc;
        }, {} as { [key: string]: Removal[] });

        return Object.entries(grouped).sort(([monthA], [monthB]) => {
            const dateA = new Date(grouped[monthA][0].createdAt);
            const dateB = new Date(grouped[monthB][0].createdAt);
            return dateB.getTime() - dateA.getTime();
        }).map(([month, removals]) => ({ type: 'month_batch' as const, month, removals }));
    } else { // 'faturado'
        const faturadoRemovals = searchedFinalizadas.filter(r => r.paymentMethod === 'faturado');
        
        const removalsByMonth: { [month: string]: Removal[] } = {};
        faturadoRemovals.forEach(r => {
            const monthYear = format(new Date(r.createdAt), 'MMMM yyyy', { locale: ptBR });
            const capitalizedMonthYear = monthYear.charAt(0).toUpperCase() + monthYear.slice(1);
            if (!removalsByMonth[capitalizedMonthYear]) {
                removalsByMonth[capitalizedMonthYear] = [];
            }
            removalsByMonth[capitalizedMonthYear].push(r);
        });

        const monthlyLotes = Object.entries(removalsByMonth).map(([month, monthRemovals]) => {
            const lotesByClinic: { [clinicId: string]: LoteFaturamento } = {};
            monthRemovals.forEach(r => {
                if (r.createdById && r.clinicName) {
                    if (!lotesByClinic[r.createdById]) {
                        lotesByClinic[r.createdById] = {
                            id: `${r.createdById}-${month}-finalizado`,
                            clinicId: r.createdById,
                            clinicName: r.clinicName,
                            removals: [],
                            totalValue: 0,
                            status: 'concluido'
                        };
                    }
                    lotesByClinic[r.createdById].removals.push(r);
                    lotesByClinic[r.createdById].totalValue += r.value;
                }
            });
            return { type: 'faturado_batch' as const, month, lotes: Object.values(lotesByClinic) };
        });

        return monthlyLotes.sort((a, b) => {
            if (a.lotes.length === 0) return 1;
            if (b.lotes.length === 0) return -1;
            const dateA = new Date(a.lotes[0].removals[0].createdAt);
            const dateB = new Date(b.lotes[0].removals[0].createdAt);
            return dateB.getTime() - dateA.getTime();
        });
    }
  }, [activeTab, removals, searchTerm, user, finalizadasFilter]);

  const handleDownload = () => {
    if (activeTab === 'finalizada') {
        let removalsToExport: Removal[] = [];
        if (finalizadasContent) {
            finalizadasContent.forEach(item => {
                if (item.type === 'month_batch') {
                    removalsToExport.push(...item.removals);
                } else if (item.type === 'faturado_batch') {
                    item.lotes.forEach(lote => {
                        removalsToExport.push(...lote.removals);
                    });
                }
            });
        }
        exportToExcel(removalsToExport, `historico_master_finalizadas_${finalizadasFilter}`);
    } else if (activeTab === 'faturado_mensal') {
        const removalsInLotes = faturamentoLotesPorMes.flatMap(monthLote => monthLote.lotes.flatMap(lote => lote.removals));
        exportToExcel(removalsInLotes, `historico_master_${activeTab}`);
    } else {
        exportToExcel(filteredRemovals, `historico_master_${activeTab}`);
    }
  };

  const tabs: { id: MasterTab; label: string }[] = [
    { id: 'remocao_solicitada', label: 'Remoção Solicitadas' },
    { id: 'dar_baixa', label: 'Dar Baixa' },
    { id: 'faturado_mensal', label: 'Faturado Mensal' },
    { id: 'finalizada', label: 'Remoções Finalizadas' },
    { id: 'estoque', label: 'Estoque' },
    { id: 'planos', label: 'Planos' },
  ];

  return (
    <Layout title="Dashboard do Financeiro Master">
       <div className="flex justify-between items-center mb-6">
        <div className="relative w-full max-w-xs">
          <input 
            type="text" 
            placeholder="Pesquisar..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border rounded-lg" />
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
        </div>
        <button 
            onClick={handleDownload}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center"
        >
            <Download className="h-5 w-5 mr-2" />Baixar Histórico
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-md">
        <div className="border-b">
          <nav className="flex flex-wrap -mb-px">
            {tabs.map(tab => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`px-4 py-3 font-medium text-sm border-b-2 ${activeTab === tab.id ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
        <div className="p-6">
          {activeTab === 'faturado_mensal' && (
            faturamentoLotesPorMes.length > 0 ? (
                <div className="space-y-8">
                    {faturamentoLotesPorMes.map(({ month, lotes }) => (
                        <div key={month} className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden">
                            <div className="p-4 bg-gray-50 border-b">
                                <h3 className="font-bold text-xl text-gray-800">{month}</h3>
                            </div>
                            <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {lotes.map(lote => (
                                    <FaturamentoCard key={lote.id} lote={lote} onGerenciar={() => setSelectedLote(lote)} />
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            ) : <p className="text-center text-gray-500 py-12">Nenhuma remoção faturada aguardando geração de boleto.</p>
          )}

          {(activeTab === 'dar_baixa' || activeTab === 'remocao_solicitada') && (
            filteredRemovals.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredRemovals.map(removal => <RemovalCard key={removal.code} removal={removal} onClick={() => setSelectedRemoval(removal)} />)}
              </div>
            ) : <p className="text-center text-gray-500 py-12">Nenhuma remoção nesta categoria.</p>
          )}
          
          {activeTab === 'finalizada' && (
            <>
              <div className="p-4 border-b flex items-center justify-center gap-2 bg-gray-50 mb-6 -mx-6 -mt-6">
                <Filter className="h-4 w-4 text-gray-500" />
                <span className="text-sm font-semibold text-gray-600 mr-2">Filtrar por:</span>
                <button 
                  onClick={() => setFinalizadasFilter('nao_faturado')} 
                  className={`px-3 py-1 text-xs rounded-full transition-colors ${finalizadasFilter === 'nao_faturado' ? 'bg-blue-600 text-white font-semibold shadow-sm' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
                >
                  Não Faturado
                </button>
                <button 
                  onClick={() => setFinalizadasFilter('faturado')} 
                  className={`px-3 py-1 text-xs rounded-full transition-colors ${finalizadasFilter === 'faturado' ? 'bg-blue-600 text-white font-semibold shadow-sm' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
                >
                  Faturado
                </button>
              </div>
              
              {finalizadasContent && finalizadasContent.length > 0 ? (
                <div className="space-y-6">
                  {finalizadasContent.map(item => {
                    if (item.type === 'month_batch') {
                      return <MonthlyBatchCard key={item.month} month={item.month} removals={item.removals} onSelectRemoval={setSelectedRemoval} />
                    }
                    if (item.type === 'faturado_batch') {
                      return (
                        <div key={item.month} className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden">
                          <div className="p-4 bg-gray-50 border-b">
                            <h3 className="font-bold text-xl text-gray-800">{item.month}</h3>
                          </div>
                          <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {item.lotes.map(lote => (
                              <FaturamentoCard key={lote.id} lote={lote} onGerenciar={() => setSelectedLote(lote)} />
                            ))}
                          </div>
                        </div>
                      )
                    }
                    return null;
                  })}
                </div>
              ) : <p className="text-center text-gray-500 py-12">Nenhuma remoção finalizada encontrada para este filtro.</p>}
            </>
          )}

          {activeTab === 'estoque' && (
            <StockManagement />
          )}

          {activeTab === 'planos' && (
            <PricingManagement />
          )}
        </div>
      </div>
      <RemovalDetailsModal removal={selectedRemoval} onClose={() => setSelectedRemoval(null)} isReadOnly={isReadOnly} viewedRole={viewedRole} />
      <FaturamentoModal lote={selectedLote} onClose={() => setSelectedLote(null)} isReadOnly={isReadOnly} />
    </Layout>
  );
};

export default FinanceiroMasterHome;
