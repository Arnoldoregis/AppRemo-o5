import React from 'react';
import { Removal, Address } from '../../types';
import { Truck, User, Dog, Phone, MapPin, Package, Eye, Map } from 'lucide-react';

interface DeliveryCardProps {
  delivery: Removal;
  onClick: () => void;
  orderNumber?: number;
}

const DeliveryCard: React.FC<DeliveryCardProps> = ({ delivery, onClick, orderNumber }) => {
  const address = delivery.deliveryAddress || delivery.removalAddress;
  const fullAddress = `${address.street}, ${address.number}, ${address.neighborhood}, ${address.city}`;

  const handleGpsClick = (e: React.MouseEvent, deliveryAddress: Address) => {
    e.stopPropagation(); // Impede que o clique no botão acione o clique no card
    const fullAddressString = `${deliveryAddress.street}, ${deliveryAddress.number}, ${deliveryAddress.city}`;
    const encodedAddress = encodeURIComponent(fullAddressString);
    window.open(`https://www.google.com/maps/search/?api=1&query=${encodedAddress}`, '_blank', 'noopener,noreferrer');
  };

  return (
    <div
      className="bg-white rounded-lg shadow-md p-4 transition-all hover:shadow-lg cursor-pointer border-l-8 border-purple-500 relative"
      onClick={onClick}
    >
      {orderNumber && (
        <div className="absolute -top-3 -left-3 bg-purple-600 text-white h-9 w-9 rounded-full flex items-center justify-center font-bold text-lg shadow-lg border-2 border-white z-10">
          {orderNumber}
        </div>
      )}
      <div className="flex justify-between items-start">
        <div className="flex-grow">
          <p className="font-mono font-bold text-purple-700 text-sm bg-purple-100 px-2.5 py-1 rounded-full inline-block mb-2">
            {delivery.code}
          </p>
          <h4 className="text-lg font-bold text-gray-800 truncate" title={delivery.pet.name}>
            <Dog className="inline h-5 w-5 mr-2" />
            {delivery.pet.name}
          </h4>
          <p className="text-sm text-gray-600 mt-1">
            <User className="inline h-4 w-4 mr-2" />
            Tutor: {delivery.tutor.name}
          </p>
        </div>
        <div className="flex-shrink-0 ml-2">
           <div className={`flex items-center text-sm font-medium text-purple-600 bg-purple-100 px-2 py-1 rounded-full`}>
              <Truck className="h-4 w-4 mr-1" />
              Entrega
            </div>
        </div>
      </div>
      <div className="mt-4 text-sm space-y-2 border-t pt-3">
        <div className="flex items-start justify-between">
            <p className="flex items-start flex-grow pr-2">
                <MapPin className="h-4 w-4 mr-2 mt-0.5 flex-shrink-0 text-gray-500" />
                <span className="text-gray-700">{fullAddress}</span>
            </p>
            <button
                onClick={(e) => handleGpsClick(e, address)}
                className="flex-shrink-0 p-1.5 bg-blue-100 text-blue-600 rounded-full hover:bg-blue-200 transition-colors"
                title="Abrir no mapa"
            >
                <Map size={14} />
            </button>
        </div>
        <p className="flex items-center">
            <Phone className="h-4 w-4 mr-2 text-gray-500" />
            <span className="text-gray-700">{delivery.tutor.phone}</span>
        </p>
        {delivery.deliveryItems && delivery.deliveryItems.length > 0 && (
          <p className="flex items-start">
            <Package className="h-4 w-4 mr-2 mt-0.5 flex-shrink-0 text-gray-500" />
            <span className="text-gray-700">
                <strong>Produtos:</strong> {delivery.deliveryItems.join(', ')}
            </span>
          </p>
        )}
      </div>
      <div className="mt-3 flex justify-end">
        <button className="text-sm text-purple-600 hover:text-purple-800 flex items-center">
            <Eye className="h-4 w-4 mr-1" />
            Ver Detalhes
        </button>
      </div>
    </div>
  );
};

export default DeliveryCard;
