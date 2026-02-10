import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useRemovals } from '../context/RemovalContext';
import { useAgenda } from '../context/AgendaContext';
import { useAuth } from '../context/AuthContext';
import Layout from '../components/Layout';
import { CalendarDays, Download, Search, Filter, PackageCheck, Truck, Plus, UserCheck, CalendarClock, CheckCircle, Award, PackageMinus } from 'lucide-react';
import { Removal } from '../types';
import RemovalCard from '../components/RemovalCard';
import RemovalDetailsModal from '../components/RemovalDetailsModal';
import { exportToExcel } from '../utils/exportToExcel';
import ScheduleDeliveryModal from '../components/modals/ScheduleDeliveryModal';
import ScheduledDeliveryList from '../components/shared/ScheduledDeliveryList';
import AwaitingPickupList from '../components/shared/AwaitingPickupList';
import MonthlyBatchCard from '../components/cards/MonthlyBatchCard';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import CertificateModal from '../components/modals/CertificateModal';
import CremationDataModal from '../components/modals/CremationDataModal';
import DeductStockModal from '../components/modals/DeductStockModal';
import ConfirmPickupModal from '../components/modals/ConfirmPickupModal';

interface FinanceiroJuniorHomeProps {
  isReadOnly?: boolean;
  viewedRole?: string;
}

const FinanceiroJuniorHome: React.FC<FinanceiroJuniorHomeProps> = ({ isReadOnly = false, viewedRole = 'financeiro_junior' }) => {
  const { removals, updateRemoval } = useRemovals();
  const { schedule } = useAgenda();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<string>('individuais');
  const [selectedRemoval, setSelectedRemoval] = useState<Removal | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [paymentFilter, setPaymentFilter] = useState<'todos' | 'convencional' | 'faturado'>('todos');
  const [deliveryFilter, setDeliveryFilter] = useState<'entrega_agendada' | 'aguardando_retirada' | 'entregue_retirado' | 'todos'>('entrega_agendada');
  const [certificateStatusFilter, setCertificateStatusFilter] = useState<'todos' | 'ag_gerar' | 'gerado'>('todos');
  const [isScheduleDeliveryModalOpen, setIsScheduleDeliveryModalOpen] = useState(false);
  const [isDeductStockModalOpen, setIsDeductStockModalOpen] = useState(false);

  // Estados para geração de certificado via card
  const [isCertificateModalOpen, setIsCertificateModalOpen] = useState(false);
  const [isCremationDataModalOpen, setIsCremationDataModalOpen] = useState(false);
  const [removalForCertificate, setRemovalForCertificate] = useState<Removal | null>(null);

  // Estado para confirmar retirada
  const [confirmingPickupRemoval, setConfirmingPickupRemoval] = useState<Removal | null>(null);

  useEffect(() => {
    if (selectedRemoval) {
      const updatedVersion = removals.find(r => r.code === selectedRemoval.code);
      if (updatedVersion) {
        setSelectedRemoval(updatedVersion);
      }
    }
    // Atualiza também o removalForCertificate se ele estiver sendo exibido
    if (removalForCertificate) {
        const updatedVersion = removals.find(r => r.code === removalForCertificate.code);
        if (updatedVersion) {
            setRemovalForCertificate(updatedVersion);
        }
    }
  }, [removals, selectedRemoval?.code, removalForCertificate?.code]);

  useEffect(() => {
    setPaymentFilter('todos');
    setCertificateStatusFilter('todos');
    if (activeTab === 'agenda_entrega') {
        setDeliveryFilter('entrega_agendada');
    } else {
        setDeliveryFilter('todos');
    }
  }, [activeTab]);

  const handleReturnToSchedule = (removalId: string) => {
    if (!user || isReadOnly) return;
    if (window.confirm('Tem certeza que deseja retornar esta entrega para a fila de agendamento?')) {
        const removalToUpdate = removals.find(r => r.id === removalId);
        if (!removalToUpdate) return;

        updateRemoval(removalToUpdate.id, {
            status: 'pronto_para_entrega',
            scheduledDeliveryDate: undefined,
            deliveryPerson: undefined,
            history: [
                ...removalToUpdate.history,
                {
                    date: new Date().toISOString(),
                    action: `Agendamento de entrega retornado por ${user.name.split(' ')[0]}.`,
                    user: user.name,
                },
            ],
        });
    }
  };

  const handleReturnToStorage = (removal: Removal) => {
    if (!user || isReadOnly) return;
    if (window.confirm('Tem certeza que deseja retornar esta remoção para "Pronto para Entrega"?')) {
        updateRemoval(removal.id, {
            status: 'pronto_para_entrega',
            deliveryStatus: 'ready_for_scheduling',
            deliveryPerson: undefined,
            history: [
                ...removal.history,
                {
                    date: new Date().toISOString(),
                    action: `Retirada cancelada/retornada por ${user.name.split(' ')[0]}. Voltou para Pronto para Entrega.`,
                    user: user.name,
                },
            ],
        });
    }
  };

  const handleCancelDelivery = (removalCode: string) => {
    if (!user || isReadOnly) return;
    if (window.confirm('Tem certeza que deseja cancelar este agendamento? A remoção voltará para "Pronto p/ Entrega".')) {
        const removalToUpdate = removals.find(r => r.code === removalCode);
        if (!removalToUpdate) return;

        updateRemoval(removalToUpdate.id, {
            status: 'pronto_para_entrega',
            scheduledDeliveryDate: undefined,
            deliveryPerson: undefined,
            history: [
                ...removalToUpdate.history,
                {
                    date: new Date().toISOString(),
                    action: `Agendamento de entrega cancelado por ${user.name.split(' ')[0]}.`,
                    user: user.name,
                },
            ],
        });
    }
  };

  const handleMarkAsDelivered = (removalId: string, data: { deliveryPerson: string; receivedBy: string; deliveryDate: string; }) => {
    if (!user || isReadOnly) return;
    const removalToUpdate = removals.find(r => r.id === removalId);
    if (!removalToUpdate) return;
    
    const isCollectiveWithProducts = removalToUpdate.modality === 'coletivo' &&
        ((removalToUpdate.customAdditionals && removalToUpdate.customAdditionals.length > 0) ||
         (removalToUpdate.additionals && removalToUpdate.additionals.length > 0));

    const nextStatus = isCollectiveWithProducts ? 'aguardando_baixa_master' : 'finalizada';

    const formattedDate = format(new Date(data.deliveryDate + 'T00:00:00'), 'dd/MM/yyyy');

    const historyAction = isCollectiveWithProducts
        ? `Entrega finalizada em ${formattedDate} por ${user.name.split(' ')[0]} e encaminhada para baixa do Master. Entregue por: ${data.deliveryPerson}. Recebido por: ${data.receivedBy}.`
        : `Entrega finalizada em ${formattedDate} por ${user.name.split(' ')[0]}. Entregue por: ${data.deliveryPerson}. Recebido por: ${data.receivedBy}.`;

    updateRemoval(removalToUpdate.id, {
        status: nextStatus,
        deliveryPerson: data.deliveryPerson,
        deliveryStatus: 'delivered',
        history: [
            ...removalToUpdate.history,
            {
                date: new Date(data.deliveryDate).toISOString(),
                action: historyAction,
                user: user.name,
            },
        ],
    });
  };

  const handleConfirmPickup = (data: { pickedUpBy: string; pickupDate: string }) => {
    if (!user || !confirmingPickupRemoval) return;

    const isCollectiveWithProducts = confirmingPickupRemoval.modality === 'coletivo' &&
        ((confirmingPickupRemoval.customAdditionals && confirmingPickupRemoval.customAdditionals.length > 0) ||
         (confirmingPickupRemoval.additionals && confirmingPickupRemoval.additionals.length > 0));

    const nextStatus = isCollectiveWithProducts ? 'aguardando_baixa_master' : 'finalizada';
    const formattedDate = format(new Date(data.pickupDate + 'T00:00:00'), 'dd/MM/yyyy');

    const historyAction = isCollectiveWithProducts
        ? `${user.role?.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())} ${user.name.split(' ')[0]} confirmou a retirada em ${formattedDate} por ${data.pickedUpBy} e encaminhou para baixa do Master.`
        : `${user.role?.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())} ${user.name.split(' ')[0]} confirmou a retirada das cinzas em ${formattedDate} por ${data.pickedUpBy}.`;

    updateRemoval(confirmingPickupRemoval.id, {
      status: nextStatus,
      deliveryStatus: 'delivered',
      history: [
        ...confirmingPickupRemoval.history,
        {
          date: new Date(data.pickupDate).toISOString(),
          action: historyAction,
          user: user.name,
        },
      ],
    });
    setConfirmingPickupRemoval(null);
  };

  const handleQuickCertificate = (e: React.MouseEvent, removal: Removal) => {
    e.stopPropagation();
    setRemovalForCertificate(removal);
    if (!removal.cremationDate || !removal.cremationCompany) {
        setIsCremationDataModalOpen(true);
    } else {
        setIsCertificateModalOpen(true);
    }
  };

  const handleConfirmCremationData = (data: { date: string; company: 'PETCÈU' | 'SQP' }) => {
    if (!user || !removalForCertificate) return;
    
    const [year, month, day] = data.date.split('-');
    const formattedDate = `${day}/${month}/${year}`;

    const updates: Partial<Removal> = {};
    const historyActions: string[] = [];

    if (!removalForCertificate.cremationDate && data.date) {
        updates.cremationDate = data.date;
        historyActions.push(`data de cremação definida para ${formattedDate}`);
    }
    if (!removalForCertificate.cremationCompany && data.company) {
        updates.cremationCompany = data.company;
        historyActions.push(`empresa de cremação definida para ${data.company}`);
    }

    if (historyActions.length > 0) {
        updateRemoval(removalForCertificate.id, {
        ...updates,
        history: [
            ...removalForCertificate.history,
            {
            date: new Date().toISOString(),
            action: `Financeiro Junior ${user.name.split(' ')[0]} atualizou dados para certificado: ${historyActions.join(' e ')}.`,
            user: user.name,
            },
        ],
        });
        
        // Atualiza o estado local para refletir imediatamente no modal de certificado
        setRemovalForCertificate(prev => prev ? ({ ...prev, ...updates }) : null);
    }
    
    setIsCremationDataModalOpen(false);
    setTimeout(() => {
        setIsCertificateModalOpen(true);
    }, 100);
  };

  const handleCertificateDownload = () => {
    if (!user || !removalForCertificate) return;
    
    updateRemoval(removalForCertificate.id, {
        certificateGenerated: true,
        history: [
            ...removalForCertificate.history,
            {
                date: new Date().toISOString(),
                action: `Certificado gerado e baixado por ${user.name.split(' ')[0]}.`,
                user: user.name,
            },
        ],
    });
  };

  const filteredRemovals = useMemo(() => {
    if (!user) return [];
    let baseFiltered: Removal[] = [];

    const isMasterViewing = user.role === 'financeiro_master' && viewedRole === 'financeiro_junior';
    const isJuniorViewingOwn = user.role === 'financeiro_junior' && !isReadOnly;

    const filterByRole = (r: Removal): boolean => {
        if (isMasterViewing) {
            return !!r.assignedFinanceiroJunior; // Master vê todas as remoções de qualquer junior
        }
        if (isJuniorViewingOwn) {
            return r.assignedFinanceiroJunior?.id === user.id; // Junior vê apenas as suas
        }
        // Fallback para outras visualizações read-only
        if (isReadOnly) {
            return !!r.assignedFinanceiroJunior;
        }
        // Caso padrão
        return r.assignedFinanceiroJunior?.id === user.id;
    };
    
    switch (activeTab) {
        case 'individuais':
            baseFiltered = removals.filter(r => r.status === 'aguardando_financeiro_junior' && r.modality !== 'coletivo' && filterByRole(r));
            break;
        case 'agendado_despedida':
            baseFiltered = Object.values(schedule).filter(filterByRole);
            break;
        case 'pronto_para_entrega':
            baseFiltered = removals.filter(r => (r.status === 'pronto_para_entrega' || r.deliveryStatus === 'ready_for_scheduling') && filterByRole(r));
            break;
        case 'agenda_entrega':
            if (deliveryFilter === 'entregue_retirado') {
                baseFiltered = removals.filter(r => {
                    if (r.status !== 'finalizada' && r.status !== 'aguardando_baixa_master') return false;
                    if (!filterByRole(r)) return false;

                    const finalizationEntry = [...r.history].reverse().find(h => 
                        h.action.includes('Entrega finalizada') || 
                        h.action.includes('finalizou a entrega') ||
                        h.action.includes('confirmou a retirada')
                    );
                    return !!finalizationEntry;
                });
            } else if (deliveryFilter === 'todos') {
                baseFiltered = removals.filter(r => (r.status === 'aguardando_retirada' || r.status === 'entrega_agendada') && filterByRole(r));
            } else {
                baseFiltered = removals.filter(r => r.status === deliveryFilter && filterByRole(r));
            }
            break;
        case 'gerar_certificados':
            baseFiltered = removals.filter(r => 
                r.modality === 'coletivo' && 
                (r.status === 'aguardando_baixa_master' || r.status === 'finalizada') && 
                r.cremationDate && r.cremationCompany &&
                (filterByRole(r) || !r.assignedFinanceiroJunior)
            );

            if (certificateStatusFilter === 'ag_gerar') {
                baseFiltered = baseFiltered.filter(r => !r.certificateGenerated);
            } else if (certificateStatusFilter === 'gerado') {
                baseFiltered = baseFiltered.filter(r => r.certificateGenerated);
            }
            break;
        default:
            baseFiltered = [];
    }

    if (paymentFilter !== 'todos' && !['agendado_despedida', 'pronto_para_entrega', 'agenda_entrega', 'gerar_certificados'].includes(activeTab)) {
        if (paymentFilter === 'faturado') {
            baseFiltered = baseFiltered.filter(r => r.paymentMethod === 'faturado');
        } else {
            baseFiltered = baseFiltered.filter(r => r.paymentMethod !== 'faturado');
        }
    }

    if (searchTerm) {
        const lowerCaseSearch = searchTerm.toLowerCase();
        return baseFiltered.filter(r =>
            r.tutor.name.toLowerCase().includes(lowerCaseSearch) ||
            r.pet.name.toLowerCase().includes(lowerCaseSearch) ||
            r.code.toLowerCase().includes(lowerCaseSearch)
        );
    }

    return baseFiltered;
  }, [activeTab, removals, searchTerm, schedule, paymentFilter, user, deliveryFilter, viewedRole, isReadOnly, certificateStatusFilter]);

  const deliveredOrPickedUpGroupedByMonth = useMemo(() => {
    if (activeTab !== 'agenda_entrega' || deliveryFilter !== 'entregue_retirado') {
        return null;
    }

    const getFinalizationDate = (removal: Removal): Date | null => {
        const finalizationEntry = [...removal.history].reverse().find(h => 
            h.action.includes('Entrega finalizada') || 
            h.action.includes('finalizou a entrega') ||
            h.action.includes('confirmou a retirada')
        );
        return finalizationEntry ? new Date(finalizationEntry.date) : null;
    };

    const grouped = filteredRemovals.reduce((acc, removal) => {
        const finalizationDate = getFinalizationDate(removal);
        if (!finalizationDate) return acc;

        const monthYear = format(finalizationDate, 'MMMM yyyy', { locale: ptBR });
        const capitalizedMonthYear = monthYear.charAt(0).toUpperCase() + monthYear.slice(1);
        
        if (!acc[capitalizedMonthYear]) {
            acc[capitalizedMonthYear] = [];
        }
        acc[capitalizedMonthYear].push(removal);
        return acc;
    }, {} as { [key: string]: Removal[] });

    return Object.entries(grouped).sort(([monthA], [monthB]) => {
        const dateA = getFinalizationDate(grouped[monthA][0]);
        const dateB = getFinalizationDate(grouped[monthB][0]);
        if (!dateA || !dateB) return 0;
        return dateB.getTime() - dateA.getTime();
    });

  }, [activeTab, deliveryFilter, filteredRemovals]);

  const handleDownload = () => {
    exportToExcel(filteredRemovals, `historico_fin_junior_${activeTab}`);
  };

  const tabs = [
    { id: 'individuais', label: 'Individuais Aguardando Contato' },
    { id: 'agendado_despedida', label: 'Agendado Despedida' },
    { id: 'pronto_para_entrega', label: 'Pronto p/ Entrega', icon: PackageCheck },
    { id: 'agenda_entrega', label: 'Agenda de Entrega', icon: Truck },
    { id: 'gerar_certificados', label: 'Gerar Certificados', icon: Award },
  ];

  const paymentFilters = [
    { id: 'todos' as const, label: 'Todos' },
    { id: 'convencional' as const, label: 'Pag. Convencional' },
    { id: 'faturado' as const, label: 'Pag. Faturado' },
  ];

  const deliveryFilters = [
    { id: 'entrega_agendada' as const, label: 'Entregas Agendadas', icon: CalendarClock },
    { id: 'aguardando_retirada' as const, label: 'Aguardando Retirada', icon: UserCheck },
    { id: 'entregue_retirado' as const, label: 'Entregue/Retirado', icon: CheckCircle },
    { id: 'todos' as const, label: 'Todos' },
  ];

  const certificateFilters = [
    { id: 'todos' as const, label: 'Todos' },
    { id: 'ag_gerar' as const, label: 'AG Gerar' },
    { id: 'gerado' as const, label: 'Certificado Gerado' },
  ];

  const renderAgendaContent = () => {
    switch (deliveryFilter) {
      case 'entrega_agendada':
        return <ScheduledDeliveryList removals={filteredRemovals} onCancelDelivery={handleCancelDelivery} onMarkAsDelivered={handleMarkAsDelivered} onReturnToSchedule={handleReturnToSchedule} onViewDetails={setSelectedRemoval} />;
      case 'aguardando_retirada':
        return (
            <AwaitingPickupList 
                removals={filteredRemovals} 
                onSelectRemoval={setSelectedRemoval} 
                title="Aguardando Retirada"
                onConfirmPickup={setConfirmingPickupRemoval}
                onReturnToStorage={handleReturnToStorage}
            />
        );
      case 'entregue_retirado':
        if (!deliveredOrPickedUpGroupedByMonth || deliveredOrPickedUpGroupedByMonth.length === 0) {
            return <p className="text-center text-gray-500 py-12">Nenhuma entrega ou retirada concluída encontrada.</p>;
        }
        return (
            <div className="space-y-6">
                {deliveredOrPickedUpGroupedByMonth.map(([month, monthRemovals]) => (
                    <MonthlyBatchCard
                        key={month}
                        month={month}
                        removals={monthRemovals}
                        onSelectRemoval={setSelectedRemoval}
                    />
                ))}
            </div>
        );
      case 'todos':
        return (
          <div className="space-y-8">
            <ScheduledDeliveryList removals={removals.filter(r => r.status === 'entrega_agendada' && r.assignedFinanceiroJunior?.id === user?.id)} onCancelDelivery={handleCancelDelivery} onMarkAsDelivered={handleMarkAsDelivered} onReturnToSchedule={handleReturnToSchedule} onViewDetails={setSelectedRemoval} />
            <AwaitingPickupList 
                removals={removals.filter(r => r.status === 'aguardando_retirada' && r.assignedFinanceiroJunior?.id === user?.id)} 
                onSelectRemoval={setSelectedRemoval} 
                title="Aguardando Retirada" 
                onConfirmPickup={setConfirmingPickupRemoval}
                onReturnToStorage={handleReturnToStorage}
            />
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <Layout title="Dashboard do Financeiro Junior">
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
        <div className="flex items-center gap-2">
            {!isReadOnly && (
                <button 
                    onClick={() => setIsDeductStockModalOpen(true)}
                    className="bg-orange-600 text-white px-4 py-2 rounded-lg flex items-center hover:bg-orange-700 transition-colors"
                >
                    <PackageMinus className="h-5 w-5 mr-2" />
                    Baixar no Estoque
                </button>
            )}
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
              <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`px-4 py-3 font-medium text-sm border-b-2 flex items-center gap-2 ${activeTab === tab.id ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
                {tab.icon && <tab.icon size={16} />}
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
        
        {activeTab === 'individuais' && (
            <div className="p-4 border-b flex items-center justify-center gap-2 bg-gray-50">
                <Filter className="h-4 w-4 text-gray-500" />
                <span className="text-sm font-semibold text-gray-600 mr-2">Filtrar por pagamento:</span>
                {paymentFilters.map(filter => (
                    <button 
                        key={filter.id}
                        onClick={() => setPaymentFilter(filter.id)} 
                        className={`px-3 py-1 text-xs rounded-full transition-colors ${paymentFilter === filter.id ? 'bg-blue-600 text-white font-semibold shadow-sm' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
                    >
                        {filter.label}
                    </button>
                ))}
            </div>
        )}

        {activeTab === 'gerar_certificados' && (
            <div className="p-4 border-b flex items-center justify-center gap-2 bg-gray-50">
                <Filter className="h-4 w-4 text-gray-500" />
                <span className="text-sm font-semibold text-gray-600 mr-2">Filtrar por status:</span>
                {certificateFilters.map(filter => (
                    <button 
                        key={filter.id}
                        onClick={() => setCertificateStatusFilter(filter.id)} 
                        className={`px-3 py-1 text-xs rounded-full transition-colors ${certificateStatusFilter === filter.id ? 'bg-blue-600 text-white font-semibold shadow-sm' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
                    >
                        {filter.label}
                    </button>
                ))}
            </div>
        )}

        <div className="p-6">
          {activeTab === 'agenda_entrega' ? (
            <div>
              <div className="flex justify-between items-center mb-4 flex-wrap gap-y-4">
                <div className="flex items-center gap-2 flex-wrap">
                    <Filter className="h-4 w-4 text-gray-500" />
                    <span className="text-sm font-semibold text-gray-600 mr-2">Filtrar por status:</span>
                    {deliveryFilters.map(filter => (
                        <button 
                            key={filter.id}
                            onClick={() => setDeliveryFilter(filter.id)} 
                            className={`px-3 py-1 text-xs rounded-full transition-colors flex items-center gap-1.5 ${deliveryFilter === filter.id ? 'bg-blue-600 text-white font-semibold shadow-sm' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
                        >
                            {filter.icon && <filter.icon size={12} />}
                            {filter.label}
                        </button>
                    ))}
                </div>
                <button
                  onClick={() => setIsScheduleDeliveryModalOpen(true)}
                  disabled={isReadOnly}
                  className="bg-green-600 text-white px-4 py-2 rounded-lg flex items-center hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Plus className="h-5 w-5 mr-2" />
                  Agendar Entrega/Retirada
                </button>
              </div>
              {renderAgendaContent()}
            </div>
          ) : filteredRemovals.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredRemovals.map(removal => (
                <div key={removal.code} className="flex flex-col">
                    <RemovalCard removal={removal} onClick={() => setSelectedRemoval(removal)} />
                    {activeTab === 'gerar_certificados' && !removal.certificateGenerated && (
                        <button
                            onClick={(e) => handleQuickCertificate(e, removal)}
                            className="mt-2 w-full py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 flex items-center justify-center gap-2 font-medium shadow-sm transition-colors"
                        >
                            <Award size={16} />
                            Gerar Certificado
                        </button>
                    )}
                    {activeTab === 'gerar_certificados' && removal.certificateGenerated && (
                        <div className="mt-2 w-full py-2 bg-green-100 text-green-800 rounded-md flex items-center justify-center gap-2 font-medium border border-green-200">
                            <CheckCircle size={16} />
                            Certificado Gerado
                        </div>
                    )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-gray-500 py-12">Nenhuma remoção nesta categoria.</p>
          )}
        </div>
      </div>
      <RemovalDetailsModal removal={selectedRemoval} onClose={() => setSelectedRemoval(null)} isReadOnly={isReadOnly} viewedRole={viewedRole} />
      <ScheduleDeliveryModal 
        isOpen={isScheduleDeliveryModalOpen} 
        onClose={() => setIsScheduleDeliveryModalOpen(false)} 
      />
      {removalForCertificate && (
        <>
            <CremationDataModal
                isOpen={isCremationDataModalOpen}
                onClose={() => setIsCremationDataModalOpen(false)}
                onConfirm={handleConfirmCremationData}
                removal={removalForCertificate}
            />
            <CertificateModal
                isOpen={isCertificateModalOpen}
                onClose={() => setIsCertificateModalOpen(false)}
                removal={removalForCertificate}
                onDownload={handleCertificateDownload}
            />
        </>
      )}
      <DeductStockModal 
        isOpen={isDeductStockModalOpen}
        onClose={() => setIsDeductStockModalOpen(false)}
      />
      {confirmingPickupRemoval && (
        <ConfirmPickupModal
            isOpen={!!confirmingPickupRemoval}
            onClose={() => setConfirmingPickupRemoval(null)}
            onConfirm={handleConfirmPickup}
            petName={confirmingPickupRemoval.pet.name}
        />
      )}
    </Layout>
  );
};

export default FinanceiroJuniorHome;
