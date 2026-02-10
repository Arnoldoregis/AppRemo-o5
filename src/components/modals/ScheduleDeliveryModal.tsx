import React, { useState, useMemo, useEffect } from 'react';
import { Removal, Address, StockItem } from '../../types';
import { useRemovals } from '../../context/RemovalContext';
import { useAuth } from '../../context/AuthContext';
import { useStock } from '../../context/StockContext';
import { X, Search, UserCheck, CalendarClock, ArrowLeft, Calendar, AlertTriangle, Dog, User, Hash, MapPin, Package, Truck, Phone, Eye } from 'lucide-react';
import { format } from 'date-fns';
import { mockDrivers } from '../../data/mock';
import { adicionaisDisponiveis } from '../../data/pricing';
import RemovalDetailsModal from '../RemovalDetailsModal';

interface ScheduleDeliveryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ScheduleDeliveryModal: React.FC<ScheduleDeliveryModalProps> = ({ isOpen, onClose }) => {
  const { removals, updateRemoval } = useRemovals();
  const { user } = useAuth();
  const { stock } = useStock();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRemoval, setSelectedRemoval] = useState<Removal | null>(null);
  const [isSchedulingDateFor, setIsSchedulingDateFor] = useState<Removal | null>(null);
  const [confirmingDelivery, setConfirmingDelivery] = useState<Removal | null>(null);
  const [confirmingPickup, setConfirmingPickup] = useState<Removal | null>(null);
  const [viewDetailsRemoval, setViewDetailsRemoval] = useState<Removal | null>(null);
  
  const [deliveryDate, setDeliveryDate] = useState('');
  const [editableAddress, setEditableAddress] = useState<Address | null>(null);
  const [deliveryItems, setDeliveryItems] = useState<{name: string, quantity: number}[]>([]);
  const [deliveryPersonName, setDeliveryPersonName] = useState('');
  
  // State for special pickup items
  const [pingenteDetails, setPingenteDetails] = useState('');
  const [urnaDiferenciadaDetails, setUrnaDiferenciadaDetails] = useState('');
  const [stockSearch, setStockSearch] = useState({ term: '', field: '' });

  const availableRemovals = useMemo(() => {
    return removals.filter(r => {
      const isReady = r.status === 'pronto_para_entrega' || r.deliveryStatus === 'ready_for_scheduling';
      if (!isReady) return false;

      if (!searchTerm) return true;

      const lowerCaseSearch = searchTerm.toLowerCase();
      return (
        r.code.toLowerCase().includes(lowerCaseSearch) ||
        r.pet.name.toLowerCase().includes(lowerCaseSearch) ||
        r.tutor.name.toLowerCase().includes(lowerCaseSearch) ||
        r.tutor.phone.replace(/\D/g, '').slice(-4).includes(lowerCaseSearch)
      );
    });
  }, [removals, searchTerm]);

  const deliveriesOnSelectedDate = useMemo(() => {
    if (!deliveryDate) return 0;
    return removals.filter(r => 
        r.status === 'entrega_agendada' && 
        r.scheduledDeliveryDate === deliveryDate
    ).length;
  }, [deliveryDate, removals]);

  const stockSearchResults = useMemo(() => {
    if (!stockSearch.term) return [];
    const lowerTerm = stockSearch.term.toLowerCase();
    return stock.filter(item => 
        item.name.toLowerCase().includes(lowerTerm) || 
        item.trackingCode.toLowerCase().includes(lowerTerm)
    );
  }, [stock, stockSearch.term]);

  useEffect(() => {
    setPingenteDetails('');
    setUrnaDiferenciadaDetails('');

    const removalForItems = confirmingDelivery || confirmingPickup;

    if (removalForItems) {
        const itemsMap = new Map<string, number>();

        const addItem = (name: string, quantity: number = 1) => {
            itemsMap.set(name, (itemsMap.get(name) || 0) + quantity);
        };

        const isContagious = 
            removalForItems.pet.causeOfDeath.toLowerCase().includes('leptospirose') ||
            removalForItems.pet.causeOfDeath.toLowerCase().includes('esporotricose');

        // 1. Add default items for individual plans
        if (removalForItems.modality.includes('individual')) {
            addItem('Urna com cinzas', 1);
            addItem('Certificado de Cremação', 1);
            if (!isContagious) {
                addItem('Carteirinha', 1);
            }
        }

        // 2. Add items from `additionals` array (standard add-ons from initial request)
        removalForItems.additionals?.forEach(ad => {
            const label = adicionaisDisponiveis.find(item => item.type === ad.type)?.label;
            if (label) {
                const isForbidden = isContagious && ['Patinha em Resina', 'Relicário', 'Carteirinha'].some(forbidden => label.includes(forbidden));
                if (!isForbidden) {
                    addItem(label, ad.quantity);
                }
            }
        });

        // 3. Add items from `customAdditionals` array (manually added products by finance/receptor)
        const customItemsCount = new Map<string, number>();
        removalForItems.customAdditionals?.forEach(ad => {
            customItemsCount.set(ad.name, (customItemsCount.get(ad.name) || 0) + 1);
        });

        customItemsCount.forEach((quantity, name) => {
            addItem(name, quantity);
        });

        const itemsArray = Array.from(itemsMap.entries()).map(([name, quantity]) => ({ name, quantity }));
        setDeliveryItems(itemsArray);
    } else {
        setDeliveryItems([]);
    }
  }, [confirmingDelivery, confirmingPickup]);

  const isDayFull = deliveriesOnSelectedDate >= 6;

  const resetAndClose = () => {
    setSearchTerm(''); setSelectedRemoval(null); setIsSchedulingDateFor(null);
    setConfirmingDelivery(null); setConfirmingPickup(null);
    setDeliveryDate(''); setEditableAddress(null); setDeliveryItems([]);
    setDeliveryPersonName(''); setPingenteDetails(''); setUrnaDiferenciadaDetails('');
    setStockSearch({ term: '', field: '' });
    onClose();
  };

  const handleItemQuantityChange = (index: number, newQuantity: number) => {
    if (isNaN(newQuantity) || newQuantity < 0) return;

    setDeliveryItems(prevItems => {
        const newItems = [...prevItems];
        newItems[index] = { ...newItems[index], quantity: newQuantity };
        return newItems;
    });
  };

  const handleFinalizePickup = () => {
    if (!confirmingPickup || !user) return;

    const finalPickupItems = deliveryItems
      .filter(item => item.quantity > 0)
      .map(item => {
        let itemName = item.name;
        if (item.name === 'Pingente' && pingenteDetails) {
            itemName = `Pingente: ${pingenteDetails}`;
        }
        if (item.name === 'Urna diferenciada' && urnaDiferenciadaDetails) {
            itemName = `Urna diferenciada: ${urnaDiferenciadaDetails}`;
        }
        return `${item.quantity}x ${itemName}`;
    });
    
    const actionText = `marcou que o tutor virá buscar os seguintes itens: ${finalPickupItems.join(', ')}.`;
    
    const updatedRemovalData: Partial<Removal> = {
      status: 'aguardando_retirada',
      deliveryStatus: 'awaiting_pickup',
      deliveryPerson: 'Tutor (Retirada na Unidade)',
      deliveryItems: finalPickupItems,
      history: [
        ...confirmingPickup.history,
        {
          date: new Date().toISOString(),
          action: `${user.role?.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())} ${user.name.split(' ')[0]} ${actionText}`,
          user: user.name,
        },
      ],
    };
    
    updateRemoval(confirmingPickup.id, updatedRemovalData);
    resetAndClose();
  };

  const handleDateSelection = () => {
    if (!isSchedulingDateFor || !deliveryDate || isDayFull) return;
    setConfirmingDelivery(isSchedulingDateFor);
    setEditableAddress(isSchedulingDateFor.deliveryAddress || isSchedulingDateFor.removalAddress);
    setIsSchedulingDateFor(null);
  };

  const handleFinalizeSchedule = () => {
    if (!confirmingDelivery || !deliveryDate || !user || !editableAddress) return;
    if (!deliveryPersonName) { alert('Por favor, selecione um entregador.'); return; }

    const finalDeliveryItems = deliveryItems
      .filter(item => item.quantity > 0)
      .map(item => {
        let itemName = item.name;
        if (item.name === 'Pingente' && pingenteDetails) {
            itemName = `Pingente: ${pingenteDetails}`;
        }
        if (item.name === 'Urna diferenciada' && urnaDiferenciadaDetails) {
            itemName = `Urna diferenciada: ${urnaDiferenciadaDetails}`;
        }
        return `${item.quantity}x ${itemName}`;
    });

    const displayDate = format(new Date(deliveryDate + 'T00:00:00'), 'dd/MM/yyyy');
    const itemsSummary = finalDeliveryItems.length > 0 ? ` Itens na entrega: ${finalDeliveryItems.join(', ')}.` : '';

    const updatedRemovalData: Partial<Removal> = {
      status: 'entrega_agendada',
      deliveryStatus: 'scheduled',
      scheduledDeliveryDate: deliveryDate,
      deliveryAddress: editableAddress,
      deliveryItems: finalDeliveryItems,
      deliveryPerson: deliveryPersonName,
      history: [
        ...confirmingDelivery.history,
        {
          date: new Date().toISOString(),
          action: `Entrega agendada para ${displayDate} por ${user.name.split(' ')[0]}.${itemsSummary}`,
          user: user.name,
        },
      ],
    };

    updateRemoval(confirmingDelivery.id, updatedRemovalData);
    resetAndClose();
  };
  
  const handleAddressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!editableAddress) return;
    const { name, value } = e.target;
    setEditableAddress({ ...editableAddress, [name]: value });
  };

  const handleStockSearchSelect = (product: StockItem) => {
    const detailString = `${product.name} (Cód: ${product.trackingCode})`;
    if (stockSearch.field === 'pingente') {
        setPingenteDetails(detailString);
    } else if (stockSearch.field === 'urna') {
        setUrnaDiferenciadaDetails(detailString);
    }
    setStockSearch({ term: '', field: '' });
  };
  
  const searchCEP = async () => {
    if (!editableAddress) return;
    const cep = editableAddress.cep.replace(/\D/g, '');
    if (cep.length === 8) {
        try {
            const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
            const data = await response.json();
            if (!data.erro) {
                setEditableAddress(prev => ({
                    ...(prev as Address),
                    street: data.logradouro,
                    neighborhood: data.bairro,
                    city: data.localidade,
                    state: data.uf,
                }));
            } else { alert('CEP não encontrado.'); }
        } catch (error) { console.error('Erro ao buscar CEP:', error); alert('Erro ao buscar CEP.'); }
    } else { alert('Por favor, digite um CEP válido.'); }
  };

  if (!isOpen) return null;

  const renderItemsList = (modalType: 'delivery' | 'pickup') => (
    <div className="space-y-2 p-3 bg-gray-100 rounded-md border max-h-60 overflow-y-auto">
        {deliveryItems.length > 0 ? (
            deliveryItems.map((item, index) => {
                const isSpecial = item.name === 'Pingente' || item.name === 'Urna diferenciada';
                return (
                    <div key={index} className="p-2 bg-white rounded-md shadow-sm">
                        <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-gray-800">{item.name}</span>
                            <div className="flex items-center gap-2">
                                <label htmlFor={`quantity-${modalType}-${index}`} className="text-xs text-gray-600">Qtd:</label>
                                <input
                                    id={`quantity-${modalType}-${index}`}
                                    type="number"
                                    value={item.quantity}
                                    onChange={(e) => handleItemQuantityChange(index, parseInt(e.target.value, 10))}
                                    className="w-16 px-2 py-1 border border-gray-300 rounded-md text-sm text-center"
                                    min="0"
                                />
                            </div>
                        </div>
                        {isSpecial && (
                            <div className="mt-2 relative">
                                <input
                                    type="text"
                                    value={item.name === 'Pingente' ? pingenteDetails : urnaDiferenciadaDetails}
                                    onChange={(e) => {
                                        if (item.name === 'Pingente') {
                                            setPingenteDetails(e.target.value);
                                            setStockSearch({ term: e.target.value, field: 'pingente' });
                                        } else {
                                            setUrnaDiferenciadaDetails(e.target.value);
                                            setStockSearch({ term: e.target.value, field: 'urna' });
                                        }
                                    }}
                                    placeholder="Descreva ou busque por código/nome no estoque"
                                    className="w-full text-sm border-gray-300 rounded-md shadow-sm"
                                />
                                {stockSearch.term && stockSearch.field === (item.name === 'Pingente' ? 'pingente' : 'urna') && stockSearchResults.length > 0 && (
                                    <div className="absolute w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg z-10 max-h-32 overflow-y-auto">
                                        {stockSearchResults.map(p => (
                                            <div key={p.id} onClick={() => handleStockSearchSelect(p)} className="px-3 py-2 hover:bg-gray-100 cursor-pointer text-xs">
                                                <p className="font-semibold">{p.name}</p>
                                                <p className="text-gray-500">Cód: {p.trackingCode} | Estoque: {p.quantity}</p>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                );
            })
        ) : (
            <p className="text-sm text-gray-500 text-center py-4">Nenhum item para entrega.</p>
        )}
    </div>
  );

  // Final Confirmation View (Pickup)
  if (confirmingPickup) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-[60] p-4">
        <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full">
          <div className="p-4 border-b flex justify-between items-center">
            <h2 className="text-xl font-bold text-gray-900">Confirmar Itens para Retirada</h2>
            <button onClick={resetAndClose} className="text-gray-400 hover:text-gray-600"><X className="h-6 w-6" /></button>
          </div>
          <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
            <div className="space-y-3 p-4 bg-gray-50 rounded-lg border">
                <p className="flex items-center gap-2"><Dog size={16} /><strong>Pet:</strong> {confirmingPickup.pet.name}</p>
                <p className="flex items-center gap-2"><User size={16} /><strong>Tutor:</strong> {confirmingPickup.tutor.name}</p>
                <p className="flex items-center gap-2"><Hash size={16} /><strong>Código:</strong> {confirmingPickup.code}</p>
            </div>
            <div className="space-y-3">
                <h3 className="font-semibold flex items-center gap-2"><Package size={16}/>Itens para Retirada</h3>
                {renderItemsList('pickup')}
            </div>
          </div>
          <div className="bg-gray-50 p-4 border-t flex justify-end items-center gap-4">
            <button onClick={() => setConfirmingPickup(null)} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md flex items-center gap-2"><ArrowLeft size={16}/> Voltar</button>
            <button onClick={handleFinalizePickup} className="px-4 py-2 bg-green-600 text-white rounded-md flex items-center gap-2"><Calendar size={16}/> Salvar Agendamento de Retirada</button>
          </div>
        </div>
      </div>
    );
  }

  // Final Confirmation View (Delivery)
  if (confirmingDelivery && editableAddress) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-[60] p-4">
        <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full">
          <div className="p-4 border-b flex justify-between items-center">
            <h2 className="text-xl font-bold text-gray-900">Confirme os Dados do Agendamento</h2>
            <button onClick={resetAndClose} className="text-gray-400 hover:text-gray-600"><X className="h-6 w-6" /></button>
          </div>
          <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
            <div className="space-y-3 p-4 bg-gray-50 rounded-lg border">
                <p className="flex items-center gap-2"><strong>Data:</strong> {format(new Date(deliveryDate + 'T00:00:00'), 'dd/MM/yyyy')}</p>
                <p className="flex items-center gap-2"><User size={16} /><strong>Tutor:</strong> {confirmingDelivery.tutor.name}</p>
                <p className="flex items-center gap-2"><Phone size={16} /><strong>Telefone:</strong> {confirmingDelivery.tutor.phone}</p>
                <p className="flex items-center gap-2"><Hash size={16} /><strong>Código:</strong> {confirmingDelivery.code}</p>
            </div>
            
            <div className="space-y-3">
                <h3 className="font-semibold flex items-center gap-2"><Truck size={16}/>Entregador *</h3>
                <select value={deliveryPersonName} onChange={(e) => setDeliveryPersonName(e.target.value)} className="w-full px-3 py-2 border rounded-md bg-white" required>
                    <option value="" disabled>Selecione um entregador</option>
                    {mockDrivers.map(driver => (<option key={driver.id} value={driver.name}>{driver.name}</option>))}
                </select>
            </div>

            <div className="space-y-3">
                <h3 className="font-semibold flex items-center gap-2"><Package size={16}/>Itens para Entrega</h3>
                {renderItemsList('delivery')}
            </div>

            <div className="space-y-3">
                <h3 className="font-semibold flex items-center gap-2"><MapPin size={16}/>Endereço de Entrega (editável)</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                    <div className="relative">
                        <input type="text" name="cep" value={editableAddress.cep} onChange={handleAddressChange} placeholder="CEP" className="w-full px-2 py-1.5 border rounded-md text-sm pr-8" />
                        <button type="button" onClick={searchCEP} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-blue-600" title="Buscar CEP"><Search size={16} /></button>
                    </div>
                    <div className="md:col-span-2"><input type="text" name="street" value={editableAddress.street} onChange={handleAddressChange} placeholder="Rua" className="w-full px-2 py-1.5 border rounded-md text-sm" /></div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
                    <input type="text" name="number" value={editableAddress.number} onChange={handleAddressChange} placeholder="Número" className="w-full px-2 py-1.5 border rounded-md text-sm" />
                    <input type="text" name="neighborhood" value={editableAddress.neighborhood} onChange={handleAddressChange} placeholder="Bairro" className="w-full px-2 py-1.5 border rounded-md text-sm" />
                    <input type="text" name="city" value={editableAddress.city} onChange={handleAddressChange} placeholder="Cidade" className="w-full px-2 py-1.5 border rounded-md text-sm" />
                    <input type="text" name="state" value={editableAddress.state} onChange={handleAddressChange} placeholder="UF" className="w-full px-2 py-1.5 border rounded-md text-sm" />
                </div>
            </div>
          </div>
          <div className="bg-gray-50 p-4 border-t flex justify-end items-center gap-4">
            <button onClick={() => { setConfirmingDelivery(null); setIsSchedulingDateFor(confirmingDelivery); }} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md flex items-center gap-2"><ArrowLeft size={16}/> Voltar</button>
            <button onClick={handleFinalizeSchedule} className="px-4 py-2 bg-green-600 text-white rounded-md flex items-center gap-2"><Calendar size={16}/> Salvar Agendamento</button>
          </div>
        </div>
      </div>
    );
  }

  // Date Selection View
  if (isSchedulingDateFor) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-[60] p-4">
        <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
          <div className="p-4 border-b flex justify-between items-center">
            <h2 className="text-xl font-bold text-gray-900">Agendar Entrega</h2>
            <button onClick={resetAndClose} className="text-gray-400 hover:text-gray-600"><X className="h-6 w-6" /></button>
          </div>
          <div className="p-6 space-y-4">
            <p>Selecione a data de entrega para <strong>{isSchedulingDateFor.pet.name}</strong>.</p>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Data da Entrega</label>
              <input type="date" value={deliveryDate} onChange={e => setDeliveryDate(e.target.value)} min={new Date().toISOString().split('T')[0]} className="w-full px-3 py-2 border rounded-md" required/>
            </div>
            {isDayFull && (
                <div className="flex items-center gap-2 p-3 bg-red-50 text-red-700 rounded-md border border-red-200">
                    <AlertTriangle size={20} />
                    <p className="text-sm">Este dia já atingiu o limite de 6 entregas. Por favor, escolha outra data.</p>
                </div>
            )}
          </div>
          <div className="bg-gray-50 p-4 border-t flex justify-end items-center gap-4">
            <button onClick={() => setIsSchedulingDateFor(null)} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md flex items-center gap-2"><ArrowLeft size={16}/> Voltar</button>
            <button onClick={handleDateSelection} disabled={!deliveryDate || isDayFull} className="px-4 py-2 bg-purple-600 text-white rounded-md flex items-center gap-2 disabled:opacity-50"><Calendar size={16}/> Confirmar Data</button>
          </div>
        </div>
      </div>
    );
  }

  // Main List View
  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full h-[80vh] flex flex-col">
        <div className="sticky top-0 bg-white p-4 border-b flex justify-between items-center z-10">
          <h2 className="text-xl font-bold text-gray-900">Agendar Entrega / Retirada</h2>
          <button onClick={resetAndClose} className="text-gray-400 hover:text-gray-600"><X className="h-6 w-6" /></button>
        </div>
        
        <div className="flex-grow flex overflow-hidden">
          <div className="w-1/2 border-r flex flex-col">
            <div className="p-4 border-b">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input type="text" placeholder="Buscar por código, pet, tutor, tel..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-2 border rounded-lg"/>
              </div>
            </div>
            <div className="overflow-y-auto">
              {availableRemovals.length > 0 ? (
                <ul className="divide-y divide-gray-200">
                  {availableRemovals.map(removal => (
                    <li key={removal.id} onClick={() => setSelectedRemoval(removal)} className={`p-4 cursor-pointer ${selectedRemoval?.id === removal.id ? 'bg-blue-50' : 'hover:bg-gray-50'}`}>
                      <p className="font-semibold">{removal.pet.name} <span className="font-normal text-gray-600">(Tutor: {removal.tutor.name})</span></p>
                      <p className="text-sm text-gray-500">Código: {removal.code}</p>
                    </li>
                  ))}
                </ul>
              ) : (<div className="text-center p-8 text-gray-500">Nenhuma remoção pronta para entrega.</div>)}
            </div>
          </div>

          <div className="w-1/2 p-6 flex flex-col justify-center items-center bg-gray-50">
            {selectedRemoval ? (
              <div className="text-center space-y-6">
                <h3 className="text-lg font-semibold">Ações para: <span className="text-blue-600">{selectedRemoval.pet.name}</span></h3>
                <p className="text-sm text-gray-600">Código: {selectedRemoval.code}</p>
                
                <div className="flex flex-col gap-4 w-full max-w-xs">
                  <button 
                    onClick={() => setViewDetailsRemoval(selectedRemoval)}
                    className="w-full px-4 py-3 bg-blue-500 text-white rounded-lg font-semibold hover:bg-blue-600 transition-colors flex items-center justify-center gap-2"
                  >
                    <Eye size={20} />
                    Ver Detalhes / Contato
                  </button>

                  <button onClick={() => setConfirmingPickup(selectedRemoval)} className="w-full px-4 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-colors flex items-center justify-center gap-2"><UserCheck size={20} />Tutor Virá Buscar</button>
                  <button onClick={() => setIsSchedulingDateFor(selectedRemoval)} className="w-full px-4 py-3 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 transition-colors flex items-center justify-center gap-2"><CalendarClock size={20} />Agendar Entrega</button>
                </div>
              </div>
            ) : (<div className="text-center text-gray-500"><p>Selecione uma remoção da lista para definir o próximo passo.</p></div>)}
          </div>
        </div>
      </div>
      {viewDetailsRemoval && (
        <RemovalDetailsModal
            removal={viewDetailsRemoval}
            onClose={() => setViewDetailsRemoval(null)}
            isReadOnly={false}
            hideEditActions={true} // Oculta o botão de editar produtos neste contexto
        />
      )}
    </div>
  );
};

export default ScheduleDeliveryModal;
