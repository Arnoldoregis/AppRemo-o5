import React from 'react';
import { User } from '../../types';
import { Building, Phone, MapPin, Edit } from 'lucide-react';

interface ClinicCardProps {
  clinic: User;
}

const ClinicCard: React.FC<ClinicCardProps> = ({ clinic }) => {
  const fullAddress = `${clinic.address.street}, ${clinic.address.number} - ${clinic.address.city}`;

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    alert(`Funcionalidade de editar a clínica "${clinic.name}" a ser implementada.`);
  };

  return (
    <div 
      className="bg-white rounded-lg shadow-md p-4 border-l-4 border-purple-500 transition-all hover:shadow-lg cursor-pointer flex flex-col justify-between"
    >
      <div>
        <div className="flex justify-between items-start mb-3">
          <div className="min-w-0 pr-2">
            <h3 className="font-bold text-gray-800 flex items-center truncate">
              <Building className="h-5 w-5 mr-2 text-gray-600 flex-shrink-0" />
              <span className="truncate" title={clinic.name}>{clinic.name}</span>
            </h3>
            <p className="text-xs text-gray-500 mt-1 ml-1 truncate">CNPJ: {clinic.cnpj || 'N/A'}</p>
          </div>
        </div>
        <div className="text-sm text-gray-700 space-y-2 mt-4">
          <div className="flex items-center">
            <Phone className="h-4 w-4 mr-2 text-gray-500" />
            <span className="truncate">{clinic.phone}</span>
          </div>
          <div className="flex items-center">
            <MapPin className="h-4 w-4 mr-2 text-gray-500" />
            <span className="truncate" title={fullAddress}>{fullAddress}</span>
          </div>
        </div>
      </div>
      <div className="mt-4 flex justify-end">
        <button 
          onClick={handleEdit}
          className="text-sm text-blue-600 hover:text-blue-800 flex items-center font-semibold"
        >
          <Edit className="h-4 w-4 mr-1" />
          Editar
        </button>
      </div>
    </div>
  );
};

export default ClinicCard;
