import React from 'react';
import { Removal, Address } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { useRemovals } from '../../context/RemovalContext';
import { X, User, Dog, MapPin, Phone, Package, Truck, CheckCircle, MessageSquare, Map } from 'lucide-react';

interface DeliveryDetailsModalProps {
  delivery: Removal | null;
  onClose: () => void;
  isReadOnly?: boolean;
}

const DetailSection: React.FC<{ title: string; icon: React.ElementType; children: React.ReactNode }> = ({ title, icon: Icon, children }) => (
  <div className="mb-4">
    <h3 className="text-md font-semibold text-gray-800 mb-2 flex items-center border-b pb-1">
      <Icon className="h-5 w-5 mr-2 text-purple-600" />
      {title}
    </h3>
    <div className="space-y-1 text-sm text-gray-700">{children}</div>
  </div>
);

const DetailItem: React.FC<{ label: string; value?: string | number | null }> = ({ label, value }) => (
  value || value === 0 ? <p><strong>{label}:</strong> {value}</p> : null
);

const DeliveryDetailsModal: React.FC<DeliveryDetailsModalProps> = ({ delivery, onClose, isReadOnly = false }) => {
  const { user } = useAuth();
  const { updateRemoval } = useRemovals();

  if (!delivery) return null;

  const handleWhatsAppClick = (phone: string) => {
    const phoneNumber = phone.replace(/\D/g, '');
    window.open(`https://wa.me/55${phoneNumber}`, '_blank', 'noopener,noreferrer');
  };

  const handleGpsClick = (deliveryAddress: Address) => {
    const fullAddressString = `${deliveryAddress.street}, ${deliveryAddress.number}, ${deliveryAddress.city}`;
    const encodedAddress = encodeURIComponent(fullAddressString);
    window.open(`https://www.google.com/maps/search/?api=1&query=${encodedAddress}`, '_blank', 'noopener,noreferrer');
  };

  const handleStartDelivery = () => {
    if (!user) return;
    updateRemoval(delivery.id, {
      status: 'entrega_a_caminho',
      history: [
        ...delivery.history,
        {
          date: new Date().toISOString(),
          action: `Motorista ${user.name.split(' ')[0]} iniciou o deslocamento para a entrega.`,
          user: user.name,
        },
      ],
    });
    onClose();
  };

  const handleFinishDelivery = () => {
    if (!user) return;
    updateRemoval(delivery.id, {
      status: 'finalizada',
      history: [
        ...delivery.history,
        {
          date: new Date().toISOString(),
          action: `Motorista ${user.name.split(' ')[0]} finalizou a entrega.`,
          user: user.name,
        },
      ],
    });
    onClose();
  };

  const address = delivery.deliveryAddress || delivery.removalAddress;
  const fullAddress = `${address.street}, ${address.number}, ${address.neighborhood}, ${address.city} - ${address.state}`;
  const products = delivery.deliveryItems?.join(', ') || 'Nenhum produto especificado';

  const renderActions = () => {
    if (isReadOnly) return null;
    if (delivery.status === 'entrega_agendada') {
      return (
        <button onClick={handleStartDelivery} className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center gap-2">
          <Truck size={16} /> A Caminho
        </button>
      );
    }
    if (delivery.status === 'entrega_a_caminho') {
      return (
        <button onClick={handleFinishDelivery} className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 flex items-center gap-2">
          <CheckCircle size={16} /> Entrega Realizada
        </button>
      );
    }
    return null;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-lg w-full max-h-[90vh] flex flex-col">
        <div className="sticky top-0 bg-white p-4 border-b flex justify-between items-center z-10">
          <h2 className="text-xl font-bold text-gray-900">
            Detalhes da Entrega - {delivery.code}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X className="h-6 w-6" /></button>
        </div>

        <div className="overflow-y-auto p-6">
          <DetailSection title="Dados do Tutor" icon={User}>
            <DetailItem label="Nome" value={delivery.tutor.name} />
            <div className="flex items-center justify-between">
                <DetailItem label="Contato" value={delivery.tutor.phone} />
                {!isReadOnly && (
                    <button
                        onClick={() => handleWhatsAppClick(delivery.tutor.phone)}
                        className="flex items-center gap-2 px-3 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded-full hover:bg-green-200 transition-colors"
                    >
                        <MessageSquare size={14} />
                        WhatsApp
                    </button>
                )}
            </div>
          </DetailSection>

          <DetailSection title="Dados do Pet" icon={Dog}>
            <DetailItem label="Nome" value={delivery.pet.name} />
          </DetailSection>

          <DetailSection title="Dados da Entrega" icon={MapPin}>
            <div className="flex items-start justify-between">
                <p className="flex-grow pr-2">{fullAddress}</p>
                 <button
                    onClick={() => handleGpsClick(address)}
                    className="flex-shrink-0 ml-4 flex items-center gap-2 px-3 py-1 bg-blue-100 text-blue-700 text-xs font-semibold rounded-full hover:bg-blue-200 transition-colors"
                >
                    <Map size={14} />
                    Mapa
                </button>
            </div>
          </DetailSection>

          <DetailSection title="Produtos" icon={Package}>
            <p>{products}</p>
          </DetailSection>
        </div>
        
        <div className="sticky bottom-0 bg-gray-50 border-t p-4 flex justify-end items-center gap-4">
            {renderActions()}
            <button onClick={onClose} className="px-6 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700">Fechar</button>
        </div>
      </div>
    </div>
  );
};

export default DeliveryDetailsModal;
