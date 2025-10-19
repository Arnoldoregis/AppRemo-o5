import React from 'react';
import { Visit } from '../../types';
import { X, User, Phone, Calendar, Clock, MapPin, Info, MessageSquare, Map } from 'lucide-react';

interface ViewVisitModalProps {
  visit: Visit | null;
  onClose: () => void;
}

const DetailSection: React.FC<{ title: string; icon: React.ElementType; children: React.ReactNode }> = ({ title, icon: Icon, children }) => (
    <div className="mb-4">
      <h3 className="text-md font-semibold text-gray-800 mb-2 flex items-center border-b pb-1">
        <Icon className="h-5 w-5 mr-2 text-blue-600" />
        {title}
      </h3>
      <div className="space-y-1 text-sm text-gray-700">{children}</div>
    </div>
);

const ViewVisitModal: React.FC<ViewVisitModalProps> = ({ visit, onClose }) => {
  if (!visit) return null;

  const handleWhatsAppClick = () => {
    if (visit.contact) {
      const phoneNumber = visit.contact.replace(/\D/g, '');
      window.open(`https://wa.me/55${phoneNumber}`, '_blank', 'noopener,noreferrer');
    }
  };

  const handleGpsClick = () => {
    const { street, number, city } = visit.address;
    const fullAddress = `${street}, ${number}, ${city}`;
    const encodedAddress = encodeURIComponent(fullAddress);
    window.open(`https://www.google.com/maps/search/?api=1&query=${encodedAddress}`, '_blank', 'noopener,noreferrer');
  };

  const fullAddress = `${visit.address.street}, ${visit.address.number} - ${visit.address.neighborhood}, ${visit.address.city} - ${visit.address.state}`;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-[60] p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-lg w-full">
        <div className="p-4 border-b flex justify-between items-center">
          <h2 className="text-xl font-bold text-gray-900">Detalhes da Visita</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X className="h-6 w-6" /></button>
        </div>
        <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
            <DetailSection title="Informações do Contato" icon={User}>
                <p><strong>Nome:</strong> {visit.name}</p>
                <div className="flex items-center justify-between">
                    <p><strong>Contato:</strong> {visit.contact || 'Não informado'}</p>
                    {visit.contact && (
                        <button
                            onClick={handleWhatsAppClick}
                            className="flex items-center gap-2 px-3 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded-full hover:bg-green-200 transition-colors"
                        >
                            <MessageSquare size={14} />
                            WhatsApp
                        </button>
                    )}
                </div>
            </DetailSection>

            <DetailSection title="Agendamento" icon={Calendar}>
                <p><strong>Data:</strong> {visit.date}</p>
                <p><strong>Hora:</strong> {visit.time}</p>
            </DetailSection>

            <DetailSection title="Localização" icon={MapPin}>
                <div className="flex items-start justify-between">
                    <p className="flex-grow pr-2">{fullAddress}</p>
                    <button
                        onClick={handleGpsClick}
                        className="flex-shrink-0 flex items-center gap-2 px-3 py-1 bg-blue-100 text-blue-700 text-xs font-semibold rounded-full hover:bg-blue-200 transition-colors"
                    >
                        <Map size={14} />
                        Mapa
                    </button>
                </div>
            </DetailSection>

            <DetailSection title="Status" icon={Info}>
                <span className={`px-2 inline-flex text-sm leading-5 font-semibold rounded-full ${
                    visit.status === 'Agendada' ? 'bg-blue-100 text-blue-800' : 
                    visit.status === 'Concluída' ? 'bg-green-100 text-green-800' :
                    'bg-red-100 text-red-800'
                }`}>
                    {visit.status}
                </span>
            </DetailSection>
        </div>
        <div className="bg-gray-50 p-4 border-t flex justify-end">
          <button onClick={onClose} className="px-6 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700">Fechar</button>
        </div>
      </div>
    </div>
  );
};

export default ViewVisitModal;
