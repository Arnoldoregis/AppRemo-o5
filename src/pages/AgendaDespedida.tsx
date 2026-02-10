import React, { useState, useMemo } from 'react';
import { startOfWeek, addDays, format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import Layout from '../components/Layout';
import { useAuth } from '../context/AuthContext';
import { useAgenda } from '../context/AgendaContext';
import IncluirRemocaoModal from '../components/modals/IncluirRemocaoModal';
import { Plus, Trash2, ArrowLeft, Save } from 'lucide-react';
import { Removal } from '../types';
import { useNavigate } from 'react-router-dom';

const AgendaDespedida: React.FC = () => {
    const { user } = useAuth();
    const { schedule, removeFarewell, saveScheduledChanges, dirtySlots } = useAgenda();
    const [modalState, setModalState] = useState<{ isOpen: boolean; slotKey: string }>({ isOpen: false, slotKey: '' });
    const navigate = useNavigate();

    // Define quais perfis têm permissão de escrita (Adicionar/Remover)
    // Operacional removido para ter apenas acesso de visualização
    const writePermissions = ['financeiro_junior', 'financeiro_master', 'receptor'];
    const canWrite = user?.role && writePermissions.includes(user.role);
    const isReadOnly = !canWrite;

    const weekDays = useMemo(() => {
        const monday = startOfWeek(new Date(), { weekStartsOn: 1 });
        return Array.from({ length: 5 }).map((_, i) => addDays(monday, i));
    }, []);

    const timeSlots = ['ENCAIXE EMERGÊNCIA', '11:00', '14:00', '16:00'];

    const handleOpenModal = (slotKey: string) => {
        setModalState({ isOpen: true, slotKey });
    };

    const handleCloseModal = () => {
        setModalState({ isOpen: false, slotKey: '' });
    };

    const renderCellContent = (slotKey: string) => {
        const scheduledRemoval: Removal | undefined = schedule[slotKey];

        if (scheduledRemoval) {
            const isDirty = dirtySlots.has(slotKey);
            return (
                <div className={`p-2 text-xs relative h-full flex flex-col justify-between ${isDirty ? 'bg-yellow-100' : ''}`}>
                    <div>
                        <p><strong>Código:</strong> {scheduledRemoval.code}</p>
                        <p><strong>Tutor:</strong> {scheduledRemoval.tutor.name}</p>
                        <p><strong>Pet:</strong> {scheduledRemoval.pet.name}</p>
                        <p><strong>Sexo:</strong> {scheduledRemoval.pet.gender.charAt(0).toUpperCase() + scheduledRemoval.pet.gender.slice(1)} / <strong>Peso:</strong> {scheduledRemoval.realWeight ? `${scheduledRemoval.realWeight} kg` : scheduledRemoval.pet.weight}</p>
                    </div>
                    {!isReadOnly && (
                        <button
                            onClick={() => removeFarewell(slotKey)}
                            className="absolute bottom-1 right-1 text-red-500 hover:text-red-700 p-1 rounded-full bg-red-100 hover:bg-red-200"
                            title="Remover agendamento"
                        >
                            <Trash2 size={14} />
                        </button>
                    )}
                </div>
            );
        }

        if (!isReadOnly) {
            return (
                <div className="h-full flex items-center justify-center">
                    <button
                        onClick={() => handleOpenModal(slotKey)}
                        className="flex items-center gap-1 text-blue-600 hover:text-blue-800 text-xs font-semibold"
                    >
                        <Plus size={14} /> Incluir Remoção
                    </button>
                </div>
            );
        }

        return <div className="p-2">&nbsp;</div>;
    };

    return (
        <Layout title="Agenda de Despedida">
            <div className="flex justify-between items-center mb-6">
                <button
                    onClick={() => navigate(-1)}
                    className="flex items-center text-blue-600 hover:text-blue-800 font-semibold"
                >
                    <ArrowLeft className="h-5 w-5 mr-2" />
                    Voltar
                </button>
                {!isReadOnly && (
                    <button
                        onClick={saveScheduledChanges}
                        disabled={dirtySlots.size === 0}
                        className="bg-green-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-green-700 transition-colors flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <Save className="h-5 w-5 mr-2" />
                        Salvar Alterações
                    </button>
                )}
            </div>
            <div className="bg-white p-6 rounded-lg shadow-lg">
                <h2 className="text-2xl font-bold text-center mb-6 uppercase">Agenda {new Date().getFullYear()}</h2>
                <div className="overflow-x-auto">
                    <table className="w-full border-collapse border border-gray-400 min-w-[1000px]">
                        <thead>
                            <tr className="bg-gray-100">
                                <th className="border border-gray-300 p-2 w-1/12"></th>
                                {weekDays.map(day => (
                                    <th key={day.toISOString()} className="border border-gray-300 p-2 text-sm font-semibold">
                                        <div className="flex justify-around items-center">
                                            <span>{format(day, 'EEEE', { locale: ptBR }).toUpperCase()}</span>
                                            <span>{format(day, 'dd/MM')}</span>
                                        </div>
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {timeSlots.map(time => (
                                <tr key={time}>
                                    <td className="border border-gray-300 p-2 text-center font-semibold text-sm">
                                        {time.includes(':') ? time.replace(':00',' HORAS') : time}
                                    </td>
                                    {weekDays.map(day => {
                                        const slotKey = `${format(day, 'yyyy-MM-dd')}-${time}`;
                                        return (
                                            <td key={day.toISOString()} className="border border-gray-300 h-28 align-top">
                                                {renderCellContent(slotKey)}
                                            </td>
                                        );
                                    })}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
            {!isReadOnly && modalState.isOpen && (
                <IncluirRemocaoModal
                    slotKey={modalState.slotKey}
                    onClose={handleCloseModal}
                />
            )}
        </Layout>
    );
};

export default AgendaDespedida;
