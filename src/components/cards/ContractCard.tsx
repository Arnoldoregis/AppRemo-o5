import React from 'react';
import { Removal } from '../../types';
import { FileText, Building2, Calendar, DollarSign, Eye, CheckCircle, Clock, FileCheck } from 'lucide-react';
import { format } from 'date-fns';

interface ContractCardProps {
  removal: Removal;
  onClick: () => void;
}

const statusConfig: { [key: string]: { label: string; icon: React.ElementType; color: string } } = {
  solicitada: { label: 'Aguardando Direcionamento', icon: Clock, color: 'text-yellow-600' },
  em_andamento: { label: 'Em Andamento', icon: Clock, color: 'text-blue-600' },
  finalizada: { label: 'Finalizado', icon: CheckCircle, color: 'text-green-600' },
  default: { label: 'Em Progresso', icon: Clock, color: 'text-gray-600' },
};

const ContractCard: React.FC<ContractCardProps> = ({ removal, onClick }) => {
  const status = statusConfig[removal.status] || statusConfig.default;
  const StatusIcon = status.icon;

  return (
    <div 
      className="bg-white rounded-lg shadow-md p-4 border-l-4 border-blue-500 transition-all hover:shadow-lg cursor-pointer flex flex-col justify-between"
      onClick={onClick}
    >
      <div>
        <div className="flex justify-between items-start mb-3">
          <div className="min-w-0 pr-2">
            <h3 className="font-bold text-gray-800 flex items-center truncate">
              <FileText className="h-5 w-5 mr-2 text-gray-600 flex-shrink-0" />
              <span className="truncate">{removal.contractNumber || 'Contrato Pendente'}</span>
            </h3>
          </div>
          <span className={`text-xs font-semibold px-2 py-1 rounded-full flex items-center gap-1.5 ${status.color.replace('text-', 'bg-').replace('600', '100')} ${status.color} flex-shrink-0`}>
            <StatusIcon size={12} />
            {status.label}
          </span>
        </div>
        <div className="text-sm text-gray-700 space-y-2 mt-4">
          <div className="flex items-center">
            <Building2 className="h-4 w-4 mr-2 text-gray-500" />
            <span className="truncate">Clínica: <strong>{removal.clinicName || 'N/A'}</strong></span>
          </div>
          <div className="flex items-center">
            <Calendar className="h-4 w-4 mr-2 text-gray-500" />
            <span>Data: <strong>{format(new Date(removal.createdAt), 'dd/MM/yyyy')}</strong></span>
          </div>
          <div className="flex items-center">
            <DollarSign className="h-4 w-4 mr-2 text-gray-500" />
            <span>Valor: <strong>R$ {removal.value.toFixed(2)}</strong></span>
          </div>
          {removal.signedContractUrl && (
            <div className="flex items-center text-green-600 mt-2 bg-green-50 p-1.5 rounded-md">
                <FileCheck className="h-4 w-4 mr-2" />
                <span className="text-xs font-semibold">Contrato Assinado Anexado</span>
            </div>
          )}
        </div>
      </div>
      <div className="mt-4 flex justify-end">
        <button className="text-sm text-blue-600 hover:text-blue-800 flex items-center font-semibold">
          <Eye className="h-4 w-4 mr-1" />
          Ver Detalhes
        </button>
      </div>
    </div>
  );
};

export default ContractCard;
