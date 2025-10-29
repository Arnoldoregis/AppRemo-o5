import React from 'react';
import { LoteFaturamento } from '../../types';
import { Building2, FileText, DollarSign, ArrowRight } from 'lucide-react';

interface FaturamentoCardProps {
  lote: LoteFaturamento;
  onGerenciar: () => void;
}

const FaturamentoCard: React.FC<FaturamentoCardProps> = ({ lote, onGerenciar }) => {
  return (
    <div 
      className="bg-white rounded-lg shadow-md p-4 border-l-4 border-orange-500 transition-all hover:shadow-lg cursor-pointer flex flex-col justify-between"
      onClick={onGerenciar}
    >
      <div>
        <div className="flex justify-between items-start mb-3">
          <div className="min-w-0 pr-2">
            <h3 className="font-bold text-gray-800 flex items-center truncate">
              <Building2 className="h-5 w-5 mr-2 text-gray-600 flex-shrink-0" />
              <span className="truncate">{lote.clinicName}</span>
            </h3>
            <p className="text-xs text-gray-500 mt-1 ml-1 truncate">CNPJ: {lote.removals[0]?.clinicCnpj || 'N/A'}</p>
          </div>
          <span className="text-xs font-semibold bg-orange-100 text-orange-700 px-2 py-1 rounded-full flex-shrink-0">
            Faturado
          </span>
        </div>
        <div className="text-sm text-gray-700 space-y-2">
          <div className="flex items-center">
            <FileText className="h-4 w-4 mr-2 text-gray-500" />
            <span>{lote.removals.length} remoções no lote</span>
          </div>
          <div className="flex items-center">
            <DollarSign className="h-4 w-4 mr-2 text-gray-500" />
            <span>Valor total: <strong>R$ {lote.totalValue.toFixed(2)}</strong></span>
          </div>
        </div>
      </div>
      <div className="mt-4 flex justify-end">
        <button className="text-sm text-blue-600 hover:text-blue-800 flex items-center font-semibold">
          Gerenciar Faturamento
          <ArrowRight className="h-4 w-4 ml-1" />
        </button>
      </div>
    </div>
  );
};

export default FaturamentoCard;
