import React, { useState, useMemo } from 'react';
import Layout from '../components/Layout';
import { useAuth } from '../context/AuthContext';
import { useRemovals } from '../context/RemovalContext';
import { Calendar, FileText, Plus, Eye, Edit, Trash2, CheckCircle } from 'lucide-react';
import { Removal, Visit } from '../types';
import RemovalDetailsModal from '../components/RemovalDetailsModal';
import ContractCard from '../components/cards/ContractCard';
import { useNavigate } from 'react-router-dom';
import ScheduleVisitModal from '../components/modals/ScheduleVisitModal';
import ViewVisitModal from '../components/modals/ViewVisitModal';
import DeleteConfirmationModal from '../components/modals/DeleteConfirmationModal';

interface RepresentanteHomeProps {
  isReadOnly?: boolean;
  viewedRole?: string;
}

const RepresentanteHome: React.FC<RepresentanteHomeProps> = ({ isReadOnly = false }) => {
  const { user } = useAuth();
  const { removals } = useRemovals();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'contratos' | 'agenda' | 'concluido'>('agenda');
  const [selectedRemoval, setSelectedRemoval] = useState<Removal | null>(null);

  // State for Agenda de Visitas
  const [isVisitModalOpen, setIsVisitModalOpen] = useState(false);
  const [editingVisit, setEditingVisit] = useState<Visit | null>(null);
  const [viewingVisit, setViewingVisit] = useState<Visit | null>(null);
  const [deletingVisit, setDeletingVisit] = useState<Visit | null>(null);

  const [visits, setVisits] = useState<Visit[]>([
    { id: 1, name: 'Clínica Vet ABC', date: '25/07/2025', time: '10:00', status: 'Agendada', contact: '41988887777', address: { cep: '80060-000', street: 'Rua XV de Novembro', number: '123', neighborhood: 'Centro', city: 'Curitiba', state: 'PR' } },
    { id: 2, name: 'João da Silva (Tutor)', date: '28/07/2025', time: '14:30', status: 'Agendada', contact: '41977776666', address: { cep: '80730-200', street: 'Alameda Dr. Carlos de Carvalho', number: '456', neighborhood: 'Batel', city: 'Curitiba', state: 'PR' } },
    { id: 3, name: 'Pet Center Curitiba', date: '01/08/2025', time: '09:00', status: 'Concluída', contact: '41966665555', address: { cep: '80730-000', street: 'Rua Padre Anchieta', number: '789', neighborhood: 'Bigorrilho', city: 'Curitiba', state: 'PR' } },
  ]);
  
  const activeVisits = useMemo(() => visits.filter(v => v.status !== 'Concluída'), [visits]);
  const completedVisits = useMemo(() => visits.filter(v => v.status === 'Concluída'), [visits]);

  const representativeRemovals = useMemo(() => {
    if (!user) return [];
    return removals.filter(r => r.representativeId === user.id);
  }, [removals, user]);
  
  const handleSaveVisit = (visitData: Omit<Visit, 'id'> & { id?: number }) => {
    if (visitData.id) {
      setVisits(prev => prev.map(v => v.id === visitData.id ? { ...v, ...visitData } as Visit : v));
    } else {
      setVisits(prev => [...prev, { ...visitData, id: Date.now() } as Visit]);
    }
    setIsVisitModalOpen(false);
    setEditingVisit(null);
  };

  const handleDeleteVisit = () => {
    if (deletingVisit) {
        setVisits(prev => prev.filter(v => v.id !== deletingVisit.id));
        setDeletingVisit(null);
    }
  };

  const handleEditClick = (visit: Visit) => {
    setEditingVisit(visit);
    setIsVisitModalOpen(true);
  };

  const renderVisitsTable = (visitsToRender: Visit[]) => {
    if (visitsToRender.length === 0) {
        return <p className="text-center text-gray-500 py-12">Nenhuma visita encontrada nesta categoria.</p>;
    }
    return (
        <div className="bg-white rounded-lg shadow-md overflow-hidden border">
            <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                    <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Clínica/Tutor</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Data</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Hora</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Telefone</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Endereço</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                        <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Ações</th>
                    </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                    {visitsToRender.map(visit => {
                        const fullAddress = `${visit.address.street}, ${visit.address.number}, ${visit.address.neighborhood}, ${visit.address.city} - ${visit.address.state}`;
                        return (
                            <tr key={visit.id} className="hover:bg-gray-50">
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{visit.name}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{visit.date}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{visit.time}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{visit.contact || 'N/A'}</td>
                                <td className="px-6 py-4 text-sm text-gray-500" title={fullAddress}>{fullAddress}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm">
                                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                        visit.status === 'Agendada' ? 'bg-blue-100 text-blue-800' : 
                                        visit.status === 'Concluída' ? 'bg-green-100 text-green-800' :
                                        'bg-red-100 text-red-800'
                                    }`}>
                                        {visit.status}
                                    </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                                  <div className="flex justify-center space-x-2">
                                    <button onClick={() => setViewingVisit(visit)} className="text-blue-600 hover:text-blue-900" title="Visualizar"><Eye className="h-5 w-5"/></button>
                                    {!isReadOnly && (
                                        <>
                                            <button onClick={() => handleEditClick(visit)} className="text-indigo-600 hover:text-indigo-900" title="Alterar"><Edit className="h-5 w-5"/></button>
                                            <button onClick={() => setDeletingVisit(visit)} className="text-red-600 hover:text-red-900" title="Excluir"><Trash2 className="h-5 w-5"/></button>
                                        </>
                                    )}
                                  </div>
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
  };
  
  const renderContent = () => {
    if (activeTab === 'contratos') {
      return (
        <div>
          <div className="flex justify-end mb-4">
            {!isReadOnly && (
              <button 
                onClick={() => navigate('/representante/gerar-contrato')}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-blue-700 transition-colors flex items-center"
              >
                <Plus className="h-5 w-5 mr-2" />
                Gerar Contrato
              </button>
            )}
          </div>
          {representativeRemovals.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {representativeRemovals.map(removal => (
                <ContractCard key={removal.id} removal={removal} onClick={() => setSelectedRemoval(removal)} />
              ))}
            </div>
          ) : (
            <p className="text-center text-gray-500 py-12">Nenhum contrato gerado por você ainda.</p>
          )}
        </div>
      );
    }

    if (activeTab === 'agenda') {
      return (
        <div>
            <div className="flex justify-end mb-4">
                {!isReadOnly && (
                    <button 
                      onClick={() => { setEditingVisit(null); setIsVisitModalOpen(true); }}
                      className="bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-blue-700 transition-colors flex items-center"
                    >
                        <Plus className="h-5 w-5 mr-2" />
                        Agendar Nova Visita
                    </button>
                )}
            </div>
            {renderVisitsTable(activeVisits)}
        </div>
      );
    }

    if (activeTab === 'concluido') {
        return renderVisitsTable(completedVisits);
    }
  };

  return (
    <Layout title="Dashboard do Representante">
        <div className="bg-white rounded-lg shadow-md">
            <div className="border-b">
                <nav className="flex flex-wrap -mb-px">
                    <button onClick={() => setActiveTab('contratos')} className={`px-4 py-3 font-medium text-sm border-b-2 flex items-center gap-2 ${activeTab === 'contratos' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
                        <FileText size={16} /> Contratos Gerados
                    </button>
                    <button onClick={() => setActiveTab('agenda')} className={`px-4 py-3 font-medium text-sm border-b-2 flex items-center gap-2 ${activeTab === 'agenda' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
                        <Calendar size={16} /> Agenda de Visitas
                    </button>
                    <button onClick={() => setActiveTab('concluido')} className={`px-4 py-3 font-medium text-sm border-b-2 flex items-center gap-2 ${activeTab === 'concluido' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
                        <CheckCircle size={16} /> Concluído
                    </button>
                </nav>
            </div>
            <div className="p-6">
                {renderContent()}
            </div>
        </div>
        <RemovalDetailsModal removal={selectedRemoval} onClose={() => setSelectedRemoval(null)} isReadOnly={isReadOnly} />
        
        <ScheduleVisitModal
            isOpen={isVisitModalOpen || !!editingVisit}
            onClose={() => { setIsVisitModalOpen(false); setEditingVisit(null); }}
            onSave={handleSaveVisit}
            visitToEdit={editingVisit}
        />
        <ViewVisitModal
            visit={viewingVisit}
            onClose={() => setViewingVisit(null)}
        />
        {deletingVisit && (
            <DeleteConfirmationModal
                isOpen={!!deletingVisit}
                onClose={() => setDeletingVisit(null)}
                onConfirm={handleDeleteVisit}
                title="Confirmar Exclusão"
                message={`Tem certeza que deseja excluir a visita para "${deletingVisit.name}"?`}
            />
        )}
    </Layout>
  );
};

export default RepresentanteHome;
