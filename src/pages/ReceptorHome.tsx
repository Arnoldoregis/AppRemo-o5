import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useRemovals } from '../context/RemovalContext';
import { useAuth } from '../context/AuthContext';
import Layout from '../components/Layout';
import { Calendar, CalendarDays, Download, Search, Plus, Filter, UserCheck, CalendarClock, CheckCircle, Map as MapIcon, List as ListIcon, ShoppingBag, Truck, PackageMinus } from 'lucide-react';
import { Removal, RemovalStatus } from '../types';
import RemovalCard from '../components/RemovalCard';
import RemovalDetailsModal from '../components/RemovalDetailsModal';
import { exportToExcel } from '../utils/exportToExcel';
import RequestTypeModal from '../components/modals/RequestTypeModal';
import ScheduleDeliveryModal from '../components/modals/ScheduleDeliveryModal';
import ScheduledDeliveryList from '../components/shared/ScheduledDeliveryList';
import { mockDrivers } from '../data/mock';
import MapComponent from '../components/shared/MapComponent';
import AwaitingPickupList from '../components/shared/AwaitingPickupList';
import { format } from 'date-fns';
import DeductStockModal from '../components/modals/DeductStockModal';
import ConfirmPickupModal from '../components/modals/ConfirmPickupModal';

interface ReceptorHomeProps {
  isReadOnly?: boolean;
  viewedRole?: string;
}

const ReceptorHome: React.FC<ReceptorHomeProps> = ({ isReadOnly = false, viewedRole = 'receptor' }) => {
  const { removals, updateRemoval } = useRemovals();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<RemovalStatus | 'agenda_entrega' | 'coletivo_liberado_venda'>('solicitada');
  const [selectedRemoval, setSelectedRemoval] = useState<Removal | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
  const [isScheduleDeliveryModalOpen, setIsScheduleDeliveryModalOpen] = useState(false);
  const [deliveryFilter, setDeliveryFilter] = useState<'entrega_agendada' | 'aguardando_retirada' | 'entregue_retirado' | 'todos'>('entrega_agendada');
  const [selectedDriverId, setSelectedDriverId] = useState<string>('todos');
  const [activeSubTab, setActiveSubTab] = useState<'list' | 'map'>('list');
  const [isDeductStockModalOpen, setIsDeductStockModalOpen] = useState(false);
  const [confirmingPickupRemoval, setConfirmingPickupRemoval] = useState<Removal | null>(null);

  useEffect(() => {
    if (selectedRemoval) {
      const updatedVersion = removals.find(r => r.id === selectedRemoval.id);
      if (updatedVersion) {
        setSelectedRemoval(updatedVersion);
      }
    }
  }, [removals, selectedRemoval]);

  useEffect(() => {
    if (activeTab === 'agenda_entrega') {
      setDeliveryFilter('entrega_agendada');
    }
    setActiveSubTab('list');
    setSelectedDriverId('todos');
  }, [activeTab]);

  const scheduledRemovalsCount = useMemo(() => {
    return removals.filter(r => r.status === 'agendada').length;
  }, [removals]);

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

  const scheduledDeliveries = useMemo(() => {
    return removals.filter(r => r.status === 'entrega_agendada');
  }, [removals]);

  const filteredDeliveriesForMap = useMemo(() => {
    if (selectedDriverId === 'todos') {
        return scheduledDeliveries;
    }
    const driver = mockDrivers.find(d => d.id === selectedDriverId);
    if (!driver) return [];
    return scheduledDeliveries.filter(d => d.deliveryPerson === driver.name);
  }, [scheduledDeliveries, selectedDriverId]);

  const filteredRemovals = useMemo(() => {
    let tabFiltered: Removal[];

    if (activeTab === 'agenda_entrega') {
        if (deliveryFilter === 'entregue_retirado') {
            // Filtra remoções finalizadas ou aguardando baixa master que tenham histórico de entrega/retirada
            tabFiltered = removals.filter(r => {
                if (r.status !== 'finalizada' && r.status !== 'aguardando_baixa_master') return false;
                const finalizationEntry = [...r.history].reverse().find(h => 
                    h.action.includes('Entrega finalizada') || 
                    h.action.includes('finalizou a entrega') ||
                    h.action.includes('confirmou a retirada')
                );
                return !!finalizationEntry;
            });
        } else if (deliveryFilter === 'todos') {
            tabFiltered = removals.filter(r => ['aguardando_retirada', 'entrega_agendada'].includes(r.status));
        } else {
            tabFiltered = removals.filter(r => r.status === deliveryFilter);
        }
    } else if (activeTab === 'em_andamento') {
        let directedRemovals = removals.filter(r => ['em_andamento', 'a_caminho'].includes(r.status));
        if (selectedDriverId !== 'todos') {
            directedRemovals = directedRemovals.filter(r => r.assignedDriver?.id === selectedDriverId);
        }
        tabFiltered = directedRemovals;
    } else if (activeTab === 'coletivo_liberado_venda') {
        tabFiltered = removals.filter(r => 
            r.modality === 'coletivo' &&
            r.status === 'aguardando_venda_receptor'
        );
    } else {
      tabFiltered = removals
        .filter(r => r.status === activeTab)
        .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    }
    
    if (searchTerm) {
      const lowerCaseSearch = searchTerm.toLowerCase();
      tabFiltered = tabFiltered.filter(r => 
        r.tutor.name.toLowerCase().includes(lowerCaseSearch) ||
        r.pet.name.toLowerCase().includes(lowerCaseSearch) ||
        (r.tutor.cpfOrCnpj && r.tutor.cpfOrCnpj.toLowerCase().includes(lowerCaseSearch)) ||
        r.modality.toLowerCase().includes(lowerCaseSearch)
      );
    }
    
    return tabFiltered;
  }, [activeTab, removals, searchTerm, deliveryFilter, selectedDriverId]);

  const handleDownload = () => {
    exportToExcel(filteredRemovals, `historico_receptor_${activeTab}`);
  };

  const tabs: { id: RemovalStatus | 'agenda_entrega' | 'coletivo_liberado_venda'; label: string; icon?: React.ElementType }[] = [
    { id: 'solicitada', label: 'Remoções Recebidas' },
    { id: 'agendada', label: 'Remoção Agendada', icon: Calendar },
    { id: 'em_andamento', label: 'Remoções Direcionadas' },
    { id: 'a_caminho', label: 'Em Andamento' },
    { id: 'concluida', label: 'Remoções Concluídas' },
    { id: 'coletivo_liberado_venda', label: 'Coletivo Liberado para Venda', icon: ShoppingBag },
    { id: 'cancelada', label: 'Remoções Canceladas' },
    { id: 'agenda_entrega', label: 'Agenda de Entrega' },
  ];

  const deliveryFilters = [
    { id: 'entrega_agendada' as const, label: 'Entregas Agendadas', icon: CalendarClock },
    { id: 'aguardando_retirada' as const, label: 'Aguardando Retirada', icon: UserCheck },
    { id: 'entregue_retirado' as const, label: 'Entregue/Retirado', icon: CheckCircle },
    { id: 'todos' as const, label: 'Todos' },
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
        return <AwaitingPickupList removals={filteredRemovals} onSelectRemoval={setSelectedRemoval} title="Entregues/Retirados (Histórico Completo)" isFinalizedList />;
      case 'todos':
        return (
          <div className="space-y-8">
            <ScheduledDeliveryList removals={removals.filter(r => r.status === 'entrega_agendada')} onCancelDelivery={handleCancelDelivery} onMarkAsDelivered={handleMarkAsDelivered} onReturnToSchedule={handleReturnToSchedule} onViewDetails={setSelectedRemoval} />
            <AwaitingPickupList 
                removals={removals.filter(r => r.status === 'aguardando_retirada')} 
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
    <Layout title="Dashboard do Receptor">
      <div className="flex justify-between items-center mb-6 gap-4 flex-wrap">
        <div className="relative w-full max-w-md">
          <input 
            type="text" 
            placeholder="Pesquisar por tutor, pet, CPF, modalidade..." 
            className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
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
                onClick={() => setIsRequestModalOpen(true)}
                disabled={isReadOnly}
                className="bg-green-600 text-white px-4 py-2 rounded-lg flex items-center hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
                <Plus className="h-5 w-5 mr-2" />
                Solicitar Remoção
            </button>
            <button 
                onClick={() => navigate('/agenda-despedida')}
                disabled={isReadOnly}
                className="bg-purple-600 text-white px-4 py-2 rounded-lg flex items-center hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
                <CalendarDays className="h-5 w-5 mr-2" />
                Agenda de Despedida
            </button>
            <button 
                onClick={handleDownload}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center hover:bg-blue-700 transition-colors"
            >
              <Download className="h-5 w-5 mr-2" />
              Baixar Histórico (Excel)
            </button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md">
        <div className="border-b">
          <nav className="flex flex-wrap -mb-px">
            {tabs.map(tab => {
              const isScheduledTab = tab.id === 'agendada';
              const hasScheduledItems = scheduledRemovalsCount > 0;
              let tabClasses = `px-4 py-3 font-medium text-sm border-b-2 transition-colors flex items-center gap-2 `;
              
              if (activeTab === tab.id) {
                tabClasses += isScheduledTab && hasScheduledItems ? 'border-red-500 text-red-600' : 'border-blue-500 text-blue-600';
              } else {
                tabClasses += isScheduledTab && hasScheduledItems ? 'border-transparent text-red-500 hover:text-red-700 animate-pulse' : 'border-transparent text-gray-500 hover:text-gray-700';
              }

              return (
                <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={tabClasses}>
                  {tab.icon && <tab.icon size={16} />}
                  {tab.label}
                  {isScheduledTab && hasScheduledItems && (
                    <span className="ml-2 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                      {scheduledRemovalsCount}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>
        <div className="p-6">
          {activeTab === 'em_andamento' ? (
            <>
              <div className="flex justify-between items-center mb-4 flex-wrap gap-4">
                <div className="flex items-center gap-2">
                  <label htmlFor="driver-filter" className="text-sm font-medium">Filtrar por Motorista:</label>
                  <select 
                      id="driver-filter" 
                      value={selectedDriverId} 
                      onChange={(e) => setSelectedDriverId(e.target.value)}
                      className="px-3 py-1.5 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                      <option value="todos">Todos os Motoristas</option>
                      {mockDrivers.map(driver => (
                          <option key={driver.id} value={driver.id}>{driver.name}</option>
                      ))}
                  </select>
                </div>
                <div className="flex items-center gap-2 rounded-lg bg-gray-200 p-1">
                    <button 
                        onClick={() => setActiveSubTab('list')} 
                        className={`px-3 py-1 text-sm font-semibold rounded-md flex items-center gap-1.5 transition-colors ${activeSubTab === 'list' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600 hover:bg-gray-300'}`}
                    >
                        <ListIcon size={16} />
                        Lista
                    </button>
                    <button 
                        onClick={() => setActiveSubTab('map')} 
                        className={`px-3 py-1 text-sm font-semibold rounded-md flex items-center gap-1.5 transition-colors ${activeSubTab === 'map' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600 hover:bg-gray-300'}`}
                    >
                        <MapIcon size={16} />
                        Mapa
                    </button>
                </div>
              </div>
              {activeSubTab === 'list' ? (
                  filteredRemovals.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                          {filteredRemovals.map(removal => <RemovalCard key={removal.id} removal={removal} onClick={() => setSelectedRemoval(removal)} />)}
                      </div>
                  ) : <p className="text-center text-gray-500 py-12">Nenhuma remoção encontrada para este filtro.</p>
              ) : (
                  <MapComponent removals={filteredRemovals} deliveries={filteredDeliveriesForMap} />
              )}
            </>
          ) : activeTab === 'agenda_entrega' ? (
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
              {filteredRemovals.map(removal => <RemovalCard key={removal.id} removal={removal} onClick={() => setSelectedRemoval(removal)} />)}
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500">
                <Truck size={48} className="mx-auto text-gray-300 mb-4" />
                <p>Nenhuma remoção encontrada nesta categoria.</p>
            </div>
          )}
        </div>
      </div>
      <RemovalDetailsModal removal={selectedRemoval} onClose={() => setSelectedRemoval(null)} isReadOnly={isReadOnly} viewedRole={viewedRole} />
      <RequestTypeModal 
        isOpen={isRequestModalOpen} 
        onClose={() => setIsRequestModalOpen(false)} 
      />
      <ScheduleDeliveryModal 
        isOpen={isScheduleDeliveryModalOpen} 
        onClose={() => setIsScheduleDeliveryModalOpen(false)} 
      />
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

export default ReceptorHome;
