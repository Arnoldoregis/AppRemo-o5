import React, { useState, useMemo } from 'react';
import { Removal } from '../../types';
import { useRemovals } from '../../context/RemovalContext';
import { useAuth } from '../../context/AuthContext';
import { Edit, Save, Send, X, Flame, CheckCircle, AlertTriangle, Gift, CreditCard, Scissors, PawPrint, Heart, Stamp, Minus, Plus } from 'lucide-react';
import { mockFinanceiroJuniors, mockOperacionais } from '../../data/mock';

interface OperacionalActionsProps {
    removal: Removal;
    onClose: () => void;
}

const OperacionalActions: React.FC<OperacionalActionsProps> = ({ removal, onClose }) => {
    const { updateRemoval } = useRemovals();
    const { user } = useAuth();
    
    // Existing states
    const [isEditing, setIsEditing] = useState(false);
    const [petCondition, setPetCondition] = useState(removal.petCondition || '');
    const [farewellInfo, setFarewellInfo] = useState(removal.farewellSchedulingInfo || '');

    // New states for additional items finalization
    const [isFinalizingAdditionals, setIsFinalizingAdditionals] = useState(false);
    const [additionalConfirmation, setAdditionalConfirmation] = useState<Record<string, 'sim' | 'nao'>>({});

    // New state for souvenir confirmation
    const [showOperatorSelection, setShowOperatorSelection] = useState(false);

    // New states for Release Checklist
    const [isReleasing, setIsReleasing] = useState(false);
    const [productionItems, setProductionItems] = useState({
        carteirinha: 0,
        pelinho: 0,
        patinha: 0,
        relicario: 0,
        carimbo: 0
    });

    const uniqueAdditionals = useMemo(() => {
        const allAdditionals: { name: string; quantity: number }[] = [
            ...(removal.additionals || []).map(ad => ({ name: ad.type.replace(/_/g, ' '), quantity: ad.quantity })),
            ...(removal.customAdditionals || []).map(ad => ({ name: ad.name, quantity: 1 }))
        ];

        const grouped = allAdditionals.reduce((acc, item) => {
            const capitalizedName = item.name.charAt(0).toUpperCase() + item.name.slice(1);
            if (!acc[capitalizedName]) {
                acc[capitalizedName] = 0;
            }
            acc[capitalizedName] += item.quantity;
            return acc;
        }, {} as Record<string, number>);

        return Object.entries(grouped);
    }, [removal.additionals, removal.customAdditionals]);

    const handleFinalizeAdditionalsClick = () => {
        const initialConfirmation = uniqueAdditionals.reduce((acc, [name]) => {
            acc[name] = 'sim';
            return acc;
        }, {} as Record<string, 'sim' | 'nao'>);
        setAdditionalConfirmation(initialConfirmation);
        setIsFinalizingAdditionals(true);
    };

    const handleConfirmationChange = (name: string, status: 'sim' | 'nao') => {
        setAdditionalConfirmation(prev => ({ ...prev, [name]: status }));
    };

    const handleConfirmProcess = () => {
        if (!user) return;
        
        const confirmationSummary = uniqueAdditionals.map(([name, quantity]) => 
            `${quantity}x ${name} (${additionalConfirmation[name].toUpperCase()})`
        ).join(', ');

        const historyEntry = {
            date: new Date().toISOString(),
            action: `Processo de adicionais finalizado por ${user.name.split(' ')[0]}: ${confirmationSummary}`,
            user: user.name,
        };

        updateRemoval(removal.id, {
            status: 'finalizada',
            history: [...removal.history, historyEntry],
        });

        onClose();
    };

    // New Handler for Souvenir
    const handleSouvenirMade = (madeBy: string) => {
        if (!user) return;

        updateRemoval(removal.id, {
            status: 'lembrancinha_feita',
            history: [
                ...removal.history,
                {
                    date: new Date().toISOString(),
                    action: `Lembrancinha produzida por ${madeBy}. Aguardando secagem/finalização.`,
                    user: user.name,
                },
            ],
        });
        onClose();
    };
    
    const handleForwardToScheduling = () => {
        if (!user) return;
    
        const juniorToAssign = removal.assignedFinanceiroJunior || {
            id: mockFinanceiroJuniors[0].id,
            name: mockFinanceiroJuniors[0].name,
        };
    
        updateRemoval(removal.id, {
            status: 'aguardando_baixa_master',
            deliveryStatus: 'ready_for_scheduling',
            assignedFinanceiroJunior: juniorToAssign,
            history: [
                ...removal.history,
                {
                    date: new Date().toISOString(),
                    action: `Lembrancinha pronta. Encaminhado por ${user.name.split(' ')[0]} para entrega (Fin. Jr.) e para baixa (Fin. Master).`,
                    user: user.name,
                },
            ],
        });
        onClose();
    };

    // Existing Handlers
    const handleSave = () => {
        if (!user || !user.name) return;
        const userName = user.name.split(' ')[0];
        updateRemoval(removal.id, {
            petCondition,
            farewellSchedulingInfo: farewellInfo,
            history: [
                ...removal.history,
                { date: new Date().toISOString(), action: `Operacional ${userName} atualizou informações do pet e despedida`, user: user.name }
            ]
        });
        setIsEditing(false);
    };

    const handleForwardToFinance = () => {
        if (!user || !user.name) return;
        const userName = user.name.split(' ')[0];
        const financeiroMasterUser = { id: 'func_financeiro_master_1', name: 'Financeiro Master 1 (Teste)' };

        updateRemoval(removal.id, {
            status: 'encaminhado_master',
            assignedFinanceiroMaster: financeiroMasterUser,
            history: [
                ...removal.history,
                { date: new Date().toISOString(), action: `Encaminhado para o Financeiro Master por ${userName}`, user: user.name }
            ]
        });
        onClose();
    };

    // Handler for Release Checklist
    const handleConfirmRelease = () => {
        if (!user || !user.name) return;
        const userName = user.name.split(' ')[0];

        const itemsList = Object.entries(productionItems)
            .filter(([_, qty]) => qty > 0)
            .map(([key, qty]) => `${qty}x ${key.charAt(0).toUpperCase() + key.slice(1)}`)
            .join(', ');
        
        const actionText = itemsList 
            ? `Liberado para cremação pelo Operacional ${userName}. Itens a produzir: ${itemsList}.`
            : `Liberado para cremação pelo Operacional ${userName}.`;

        updateRemoval(removal.id, {
            status: 'finalizada',
            history: [
                ...removal.history,
                { 
                    date: new Date().toISOString(), 
                    action: actionText, 
                    user: user.name 
                }
            ]
        });
        onClose();
    };

    const handleMarkAsCremated = () => {
        if (!user) return;
        if (!removal.cremationCompany) {
            alert('Empresa de cremação não definida. Não é possível marcar como cremado.');
            return;
        }
        updateRemoval(removal.id, {
            status: 'cremado',
            history: [
                ...removal.history,
                {
                    date: new Date().toISOString(),
                    action: `Marcado como cremado por ${user.name.split(' ')[0]} na empresa ${removal.cremationCompany}.`,
                    user: user.name,
                },
            ],
        });
        onClose();
    };

    const updateProductionItem = (item: keyof typeof productionItems, delta: number) => {
        setProductionItems(prev => ({
            ...prev,
            [item]: Math.max(0, prev[item] + delta)
        }));
    };

    // JSX Logic
    if (removal.status === 'aguardando_producao_adicionais') {
        if (showOperatorSelection) {
            return (
                <div className="w-full p-4 bg-gray-50 rounded-lg border">
                    <h4 className="font-semibold text-gray-800 mb-4 text-center">
                        Quem produziu a lembrancinha?
                    </h4>
                    <div className="space-y-2">
                        {mockOperacionais.map(op => (
                            <button 
                                key={op.id}
                                onClick={() => handleSouvenirMade(op.name)}
                                className="w-full px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 text-left"
                            >
                                {op.name}
                            </button>
                        ))}
                        <button 
                            onClick={() => handleSouvenirMade('Ambos')}
                            className="w-full px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 text-left"
                        >
                            Ambos
                        </button>
                    </div>
                    <button 
                        onClick={() => setShowOperatorSelection(false)} 
                        className="w-full text-center mt-4 text-sm text-gray-500 hover:underline"
                    >
                        Cancelar
                    </button>
                </div>
            );
        }
        return (
            <button
                onClick={() => setShowOperatorSelection(true)}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 flex items-center gap-2"
            >
                <Gift size={16} /> Lembrancinha Feita
            </button>
        );
    }
    
    if (removal.status === 'lembrancinha_feita') {
        return (
            <button
                onClick={handleForwardToScheduling}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 flex items-center gap-2"
            >
                <Send size={16} /> Encaminhar p/ Agendamento e Baixa
            </button>
        );
    }

    if (removal.status === 'concluida') {
        const isIndividual = removal.modality.includes('individual');
        const isForwardDisabled = isIndividual && !removal.farewellSchedulingInfo;

        if (isEditing && isIndividual) {
            return (
                <div className="w-full space-y-4 p-4 bg-gray-100 rounded-lg">
                    <h4 className="font-semibold text-gray-800">Editar Informações Operacionais</h4>
                    <div className="space-y-3">
                        <div>
                            <label className="text-xs font-medium text-gray-600">Condição do Pet</label>
                            <textarea 
                                value={petCondition}
                                onChange={e => setPetCondition(e.target.value)}
                                placeholder="Descreva a condição em que o pet foi recebido..."
                                rows={3}
                                className="w-full px-2 py-1 border rounded-md text-sm"
                            />
                        </div>
                        <div>
                            <label className="text-xs font-medium text-gray-600">Informações para Agendamento de Despedida</label>
                            <select
                                value={farewellInfo}
                                onChange={e => setFarewellInfo(e.target.value)}
                                className="w-full px-2 py-1 border rounded-md text-sm"
                            >
                                <option value="">Selecione uma opção</option>
                                <option value="LIVRE">LIVRE</option>
                                <option value="11:00">11:00</option>
                                <option value="14:00">14:00</option>
                                <option value="16:00">16:00</option>
                                <option value="11:00 ou 16:00">11:00 ou 16:00</option>
                            </select>
                        </div>
                    </div>
                    <div className="flex justify-end gap-2 pt-2">
                      <button onClick={() => setIsEditing(false)} className="px-4 py-2 bg-gray-300 text-gray-800 rounded-md text-sm flex items-center gap-1">
                          <X size={14} /> Cancelar
                      </button>
                      <button onClick={handleSave} className="px-4 py-2 bg-green-600 text-white rounded-md text-sm flex items-center gap-1">
                          <Save size={14} /> Salvar Informações
                      </button>
                  </div>
                </div>
            );
        }

        return (
            <div className="flex items-center gap-2">
                {isIndividual && (
                    <button onClick={() => setIsEditing(true)} className="px-4 py-2 bg-yellow-500 text-white rounded-md hover:bg-yellow-600 flex items-center gap-2">
                        <Edit size={16} /> Editar Infos de Despedida
                    </button>
                )}
                <div className="relative group">
                    <button 
                        onClick={handleForwardToFinance} 
                        disabled={isForwardDisabled}
                        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <Send size={16} /> Encaminhar para Financeiro
                    </button>
                    {isForwardDisabled && (
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-max px-3 py-1.5 bg-gray-800 text-white text-xs rounded-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                            <AlertTriangle className="inline h-4 w-4 mr-1.5" />
                            É necessário definir as informações de despedida antes de encaminhar.
                            <div className="absolute left-1/2 -translate-x-1/2 top-full w-0 h-0 border-x-4 border-x-transparent border-t-4 border-t-gray-800"></div>
                        </div>
                    )}
                </div>
            </div>
        );
    }

    if (removal.status === 'aguardando_baixa_master') {
        const isColetivoAdicional = removal.modality === 'coletivo' && 
                                    ((removal.customAdditionals && removal.customAdditionals.length > 0) || (removal.additionals && removal.additionals.length > 0));

        if (isColetivoAdicional) {
            if (isFinalizingAdditionals) {
                return (
                    <div className="w-full space-y-4 p-4 bg-gray-100 rounded-lg">
                        <h4 className="font-semibold text-gray-800">Confirmar Produção de Adicionais</h4>
                        <div className="space-y-3">
                            {uniqueAdditionals.map(([name, quantity]) => (
                                <div key={name} className="flex justify-between items-center p-3 bg-white border rounded-md">
                                    <div>
                                        <p className="font-medium">{name}</p>
                                        <p className="text-sm text-gray-500">Quantidade: {quantity}</p>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <span className="text-sm font-medium">Foi feito?</span>
                                        <div className="flex gap-3">
                                            <label className="flex items-center gap-1 cursor-pointer">
                                                <input 
                                                    type="radio" 
                                                    name={`confirm-${name}`} 
                                                    value="sim" 
                                                    checked={additionalConfirmation[name] === 'sim'}
                                                    onChange={() => handleConfirmationChange(name, 'sim')}
                                                    className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300"
                                                />
                                                Sim
                                            </label>
                                            <label className="flex items-center gap-1 cursor-pointer">
                                                <input 
                                                    type="radio" 
                                                    name={`confirm-${name}`} 
                                                    value="nao" 
                                                    checked={additionalConfirmation[name] === 'nao'}
                                                    onChange={() => handleConfirmationChange(name, 'nao')}
                                                    className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300"
                                                />
                                                Não
                                            </label>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="flex justify-end gap-2 pt-2">
                            <button onClick={() => setIsFinalizingAdditionals(false)} className="px-4 py-2 bg-gray-300 text-gray-800 rounded-md text-sm flex items-center gap-1">
                                <X size={14} /> Cancelar
                            </button>
                            <button onClick={handleConfirmProcess} className="px-4 py-2 bg-green-600 text-white rounded-md text-sm flex items-center gap-1">
                                <Save size={14} /> Confirmar Finalização
                            </button>
                        </div>
                    </div>
                );
            }

            return (
                <div className="flex items-center gap-2">
                    <button
                        onClick={handleFinalizeAdditionalsClick}
                        className="px-4 py-2 bg-teal-600 text-white rounded-md hover:bg-teal-700 flex items-center gap-2"
                    >
                        <CheckCircle size={16} /> Processo Finalizado
                    </button>
                </div>
            );
        }

        // This is the individual logic
        if (isReleasing) {
            const itemsConfig = [
                { key: 'carteirinha', label: 'Carteirinha', icon: CreditCard },
                { key: 'pelinho', label: 'Pelinho', icon: Scissors },
                { key: 'patinha', label: 'Patinha', icon: PawPrint },
                { key: 'relicario', label: 'Relicário', icon: Heart },
                { key: 'carimbo', label: 'Carimbo', icon: Stamp },
            ];

            return (
                <div className="w-full space-y-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <h4 className="font-semibold text-gray-800 text-center mb-2">Itens a Produzir</h4>
                    <div className="space-y-2">
                        {itemsConfig.map((item) => (
                            <div key={item.key} className="flex items-center justify-between p-2 bg-white rounded-md shadow-sm">
                                <div className="flex items-center gap-2">
                                    <item.icon className="text-gray-500 h-5 w-5" />
                                    <span className="text-sm font-medium text-gray-700">{item.label}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button 
                                        onClick={() => updateProductionItem(item.key as keyof typeof productionItems, -1)}
                                        className="p-1 rounded-full bg-gray-200 hover:bg-gray-300 text-gray-600"
                                    >
                                        <Minus size={14} />
                                    </button>
                                    <span className="w-6 text-center font-bold text-gray-800">
                                        {productionItems[item.key as keyof typeof productionItems]}
                                    </span>
                                    <button 
                                        onClick={() => updateProductionItem(item.key as keyof typeof productionItems, 1)}
                                        className="p-1 rounded-full bg-blue-100 hover:bg-blue-200 text-blue-600"
                                    >
                                        <Plus size={14} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className="flex gap-2 pt-2">
                        <button 
                            onClick={() => setIsReleasing(false)} 
                            className="flex-1 px-4 py-2 bg-gray-300 text-gray-800 rounded-md hover:bg-gray-400 text-sm font-medium"
                        >
                            Retornar
                        </button>
                        <button 
                            onClick={handleConfirmRelease} 
                            className="flex-1 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 text-sm font-medium"
                        >
                            Salvar / Enviar Cremação
                        </button>
                    </div>
                </div>
            );
        }

        return (
            <div className="flex items-center gap-2">
                <button 
                    onClick={() => setIsReleasing(true)} 
                    className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 flex items-center gap-2"
                >
                    <Flame size={16} /> Liberar / Cremar
                </button>
            </div>
        );
    }

    if (removal.status === 'finalizada' && removal.modality.includes('individual')) {
        return (
            <div className="flex items-center gap-2">
                <button 
                    onClick={handleMarkAsCremated} 
                    className="px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 flex items-center gap-2"
                >
                    <Flame size={16} /> Marcar como Cremado
                </button>
            </div>
        );
    }

    return null;
};

export default OperacionalActions;
