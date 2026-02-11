import React, { useState, useMemo, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useRemovals } from '../context/RemovalContext';
import Layout from '../components/Layout';
import { Download, Search, List, Clock, CheckCircle, Package, Truck, Loader, AlertTriangle, PackageMinus, MapPin } from 'lucide-react';
import { Removal, RemovalStatus, NextTask } from '../types';
import RemovalCard from '../components/RemovalCard';
import RemovalDetailsModal from '../components/RemovalDetailsModal';
import { exportToExcel } from '../utils/exportToExcel';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import MonthlyBatchCard from '../components/cards/MonthlyBatchCard';
import DeliveryCard from '../components/cards/DeliveryCard';
import DeliveryDetailsModal from '../components/modals/DeliveryDetailsModal';
import { geocodeAddress, calculateDistance } from '../utils/geoUtils';
import DeductStockModal from '../components/modals/DeductStockModal';

type MotoristaTab = RemovalStatus | 'concluidas' | 'entregas_pendentes' | 'entregas_a_caminho';

interface MotoristaHomeProps {
  isReadOnly?: boolean;
  viewedRole?: string;
}

const MotoristaHome: React.FC<MotoristaHomeProps> = ({ isReadOnly = false, viewedRole = 'motorista' }) => {
  const { user } = useAuth();
  const { removals } = useRemovals();
  const [activeTab, setActiveTab] = useState<MotoristaTab>('em_andamento');
  const [selectedRemoval, setSelectedRemoval] = useState<Removal | null>(null);
  const [selectedDelivery, setSelectedDelivery] = useState<Removal | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const [location, setLocation] = useState<{ lat: number; lon: number } | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [isSorting, setIsSorting] = useState(false);
  const [displayRemovals, setDisplayRemovals] = useState<Removal[]>([]);
  const [isDeductStockModalOpen, setIsDeductStockModalOpen] = useState(false);
  
  // New state for auto-sort toggle
  const [isAutoSortEnabled, setIsAutoSortEnabled] = useState(false);

  const handleCloseModal = (nextTask?: NextTask) => {
    if (nextTask) {
        setSelectedRemoval(null);
        setSelectedDelivery(null);
        
        setTimeout(() => {
            if (nextTask.taskType === 'delivery') {
                setSelectedDelivery(nextTask);
            } else {
                setSelectedRemoval(nextTask);
            }
        }, 50);
    } else {
        setSelectedRemoval(null);
        setSelectedDelivery(null);
    }
  };

  useEffect(() => {
    const defaultLocation = { lat: -25.4284, lon: -49.2733 }; // Centro de Curitiba
    setLocation(defaultLocation);
    setLocationError(null);
  }, []);

  const driverRemovals = useMemo(() => {
    if (!user) return [];
    return removals.filter(r => r.assignedDriver?.id === user.id);
  }, [removals, user]);
  
  const driverDeliveries = useMemo(() => {
    if (!user) return [];
    return removals.filter(r => r.deliveryPerson === user.name);
  }, [removals, user]);

  const removalsForCurrentTab = useMemo(() => {
    let sourceData: Removal[] = [];
    if (['em_andamento', 'a_caminho', 'removido'].includes(activeTab)) {
        sourceData = driverRemovals.filter(r => r.status === activeTab);
    } else if (['entregas_pendentes', 'entregas_a_caminho'].includes(activeTab)) {
        if (activeTab === 'entregas_pendentes') {
            sourceData = driverDeliveries.filter(r => r.status === 'entrega_agendada');
        } else { // entregas_a_caminho
            sourceData = driverDeliveries.filter(r => r.status === 'entrega_a_caminho');
        }
    }

    if (searchTerm) {
        const lowerCaseSearch = searchTerm.toLowerCase();
        sourceData = sourceData.filter(r => 
            r.tutor.name.toLowerCase().includes(lowerCaseSearch) ||
            r.pet.name.toLowerCase().includes(lowerCaseSearch) ||
            r.code.toLowerCase().includes(lowerCaseSearch)
        );
    }

    // Ordenação Padrão: Prioridade primeiro, depois por data (mais antigo primeiro - FIFO)
    return sourceData.sort((a, b) => {
        // 1. Prioridade
        if (a.isPriority && !b.isPriority) return -1;
        if (!a.isPriority && b.isPriority) return 1;
        
        // 2. Data (FIFO)
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    });
  }, [activeTab, driverRemovals, driverDeliveries, searchTerm]);

  // Effect to handle sorting automatically if enabled
  useEffect(() => {
    const processList = async () => {
        // Only sort if enabled and in relevant tabs
        if (isAutoSortEnabled && ['em_andamento', 'a_caminho'].includes(activeTab) && location && removalsForCurrentTab.length > 0) {
            setIsSorting(true);
            try {
                const removalsWithDistance = [];
                for (const removal of removalsForCurrentTab) {
                    const removalCoords = await geocodeAddress(removal.removalAddress);
                    // Small delay to prevent UI freezing and API rate limits
                    await new Promise(resolve => setTimeout(resolve, 50)); 
                    
                    const distance = removalCoords ? calculateDistance(location, removalCoords) : Infinity;
                    removalsWithDistance.push({ ...removal, distance });
                }

                // Mantém prioridade no topo, depois ordena por distância
                const priority = removalsWithDistance.filter(r => r.isPriority).sort((a, b) => a.distance - b.distance);
                const normal = removalsWithDistance.filter(r => !r.isPriority).sort((a, b) => a.distance - b.distance);

                setDisplayRemovals([...priority, ...normal]);
            } catch (error) {
                console.error("Erro ao ordenar automaticamente:", error);
                setDisplayRemovals(removalsForCurrentTab);
            } finally {
                setIsSorting(false);
            }
        } else {
            // If disabled or not in relevant tab, just show the list as is (already sorted by priority/date)
            setDisplayRemovals(removalsForCurrentTab);
        }
    };

    processList();
  }, [removalsForCurrentTab, isAutoSortEnabled, activeTab, location]);

  // Manual optimization function (still available if auto-sort is off)
  const handleOptimizeRoute = async () => {
    if (!location || displayRemovals.length === 0) return;
    setIsSorting(true);
    try {
        const removalsWithDistance = [];
        for (const removal of displayRemovals) {
            const removalCoords = await geocodeAddress(removal.removalAddress);
            await new Promise(resolve => setTimeout(resolve, 100)); 
            const distance = removalCoords ? calculateDistance(location, removalCoords) : Infinity;
            removalsWithDistance.push({ ...removal, distance });
        }
        // Mantém prioridade no topo, depois ordena por distância
        const priority = removalsWithDistance.filter(r => r.isPriority).sort((a, b) => a.distance - b.distance);
        const normal = removalsWithDistance.filter(r => !r.isPriority).sort((a, b) => a.distance - b.distance);
        setDisplayRemovals([...priority, ...normal]);
    } catch (error) {
        console.error("Erro ao otimizar rota:", error);
    } finally {
        setIsSorting(false);
    }
  };

  const concluidasGroupedByMonth = useMemo(() => {
    if (activeTab !== 'concluidas') return null;
    const completedRemovalStatuses: RemovalStatus[] = ['concluida', 'aguardando_financeiro_junior', 'aguardando_baixa_master', 'finalizada', 'cremado', 'pronto_para_entrega'];
    let completedTasks = [...driverRemovals.filter(r => completedRemovalStatuses.includes(r.status)), ...driverDeliveries.filter(d => d.status === 'finalizada')];
    completedTasks = Array.from(new Map(completedTasks.map(item => [item.id, item])).values());
    if (searchTerm) {
        const lowerCaseSearch = searchTerm.toLowerCase();
        completedTasks = completedTasks.filter(r => r.tutor.name.toLowerCase().includes(lowerCaseSearch) || r.pet.name.toLowerCase().includes(lowerCaseSearch) || r.code.toLowerCase().includes(lowerCaseSearch));
    }
    const grouped = completedTasks.reduce((acc, task) => {
        const monthYear = format(new Date(task.createdAt), 'MMMM yyyy', { locale: ptBR });
        const capitalizedMonthYear = monthYear.charAt(0).toUpperCase() + monthYear.slice(1);
        if (!acc[capitalizedMonthYear]) {
            acc[capitalizedMonthYear] = [];
        }
        acc[capitalizedMonthYear].push(task);
        return acc;
    }, {} as { [key: string]: Removal[] });
    return Object.entries(grouped).sort(([monthA], [monthB]) => new Date(grouped[monthB][0].createdAt).getTime() - new Date(grouped[monthA][0].createdAt).getTime());
  }, [activeTab, driverRemovals, driverDeliveries, searchTerm]);

  const handleDownload = () => {
    if (activeTab === 'concluidas' && concluidasGroupedByMonth) {
      const removalsToExport = concluidasGroupedByMonth.flatMap(([, monthRemovals]) => monthRemovals);
      exportToExcel(removalsToExport, `historico_motorista_concluidas`);
    } else {
      exportToExcel(displayRemovals, `historico_motorista_${activeTab}`);
    }
  };

  const tabs: { id: MotoristaTab; label: string, icon: React.ElementType }[] = [
    { id: 'em_andamento', label: 'Remoções Recebidas', icon: List },
    { id: 'a_caminho', label: 'Remoções em Andamento', icon: Clock },
    { id: 'removido', label: 'Removidas', icon: CheckCircle },
    { id: 'entregas_pendentes', label: 'Entregas Pendentes', icon: Package },
    { id: 'entregas_a_caminho', label: 'Entregas em Andamento', icon: Truck },
    { id: 'concluidas', label: 'Histórico Concluído', icon: CheckCircle },
  ];

  const renderContent = () => {
    if (isSorting) {
        return (
            <div className="text-center py-12 text-gray-500 flex flex-col items-center">
                <Loader className="animate-spin h-8 w-8 text-blue-500 mb-4" />
                <p>Otimizando rota com base na sua localização...</p>
            </div>
        );
    }
    if (locationError && ['em_andamento', 'a_caminho'].includes(activeTab)) {
        return (
            <div className="text-center py-12 text-red-600 bg-red-50 p-4 rounded-lg flex flex-col items-center">
                <AlertTriangle className="h-8 w-8 mb-4" />
                <p className="font-semibold">Erro de Localização</p>
                <p>{locationError}</p>
            </div>
        );
    }

    if (['entregas_pendentes', 'entregas_a_caminho'].includes(activeTab)) {
        return displayRemovals.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {displayRemovals.map((delivery, index) => 
                    <DeliveryCard 
                        key={delivery.id} 
                        delivery={delivery} 
                        onClick={() => setSelectedDelivery(delivery)} 
                        orderNumber={index + 1}
                    />
                )}
            </div>
        ) : <p className="text-center text-gray-500 py-12">Nenhuma entrega nesta categoria.</p>;
    }

    if (activeTab === 'concluidas') {
        return concluidasGroupedByMonth && concluidasGroupedByMonth.length > 0 ? (
            <div className="space-y-6">
                {concluidasGroupedByMonth.map(([month, monthRemovals]) => (
                    <MonthlyBatchCard 
                        key={month} 
                        month={month} 
                        removals={monthRemovals} 
                        onSelectRemoval={setSelectedRemoval}
                    />
                ))}
            </div>
        ) : <p className="text-center text-gray-500 py-12">Nenhuma remoção concluída encontrada.</p>;
    }

    return displayRemovals.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {displayRemovals.map((removal, index) => {
                return (
                    <RemovalCard 
                        key={removal.id} 
                        removal={removal} 
                        onClick={() => setSelectedRemoval(removal)} 
                        orderNumber={index + 1}
                    />
                );
            })}
        </div>
    ) : <p className="text-center text-gray-500 py-12">Nenhuma solicitação nesta categoria.</p>;
  };

  return (
    <Layout title="Dashboard do Motorista">
      <div className="flex justify-between items-center mb-6 gap-4 flex-wrap">
        <div className="relative w-full max-w-md">
          <input 
            type="text" 
            placeholder="Pesquisar por tutor, pet, código..." 
            className="w-full pl-10 pr-4 py-2 border rounded-lg"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
        </div>
        <div className="flex gap-2 flex-wrap items-center">
            {/* Toggle Switch for Auto Sort - Only visible in 'em_andamento' */}
            {activeTab === 'em_andamento' && (
                <div className="flex items-center bg-white border rounded-lg px-3 py-2 mr-2 shadow-sm">
                    <label className="flex items-center cursor-pointer gap-2">
                        <div className="relative">
                            <input 
                                type="checkbox" 
                                className="sr-only" 
                                checked={isAutoSortEnabled} 
                                onChange={(e) => setIsAutoSortEnabled(e.target.checked)} 
                            />
                            <div className={`block w-10 h-6 rounded-full transition-colors ${isAutoSortEnabled ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                            <div className={`absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${isAutoSortEnabled ? 'transform translate-x-4' : ''}`}></div>
                        </div>
                        <span className="text-sm font-medium text-gray-700 select-none">
                            Ordenar por Proximidade
                        </span>
                    </label>
                </div>
            )}

            {/* Manual Optimize Button - Only visible if auto-sort is OFF and in relevant tabs */}
            {['em_andamento', 'a_caminho'].includes(activeTab) && !isReadOnly && !isAutoSortEnabled && displayRemovals.length > 1 && (
                <button
                    onClick={handleOptimizeRoute}
                    disabled={isSorting}
                    className="bg-green-600 text-white px-4 py-2 rounded-lg flex items-center hover:bg-green-700 transition-colors disabled:opacity-50"
                >
                    {isSorting ? <Loader className="animate-spin h-5 w-5 mr-2" /> : <MapPin className="h-5 w-5 mr-2" />}
                    Otimizar Rota
                </button>
            )}

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
                <tab.icon size={16} />
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
        <div className="p-6">
          {renderContent()}
        </div>
      </div>
      <RemovalDetailsModal 
        removal={selectedRemoval} 
        onClose={handleCloseModal}
        isReadOnly={isReadOnly}
        viewedRole={viewedRole}
      />
      <DeliveryDetailsModal 
        delivery={selectedDelivery} 
        onClose={() => handleCloseModal()} 
        isReadOnly={isReadOnly}
      />
      <DeductStockModal 
        isOpen={isDeductStockModalOpen}
        onClose={() => setIsDeductStockModalOpen(false)}
      />
    </Layout>
  );
};

export default MotoristaHome;
