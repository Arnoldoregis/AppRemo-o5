import React from 'react';
import { Removal, RemovalStatus } from '../types';
import { format } from 'date-fns';
import { List, Clock, CheckCircle, FileWarning, FileCheck, XCircle, Files, Eye, Send, Flame, PackageCheck, UserCheck, CalendarClock, AlertTriangle, ShoppingBag, HardHat, Truck, ClipboardCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface RemovalCardProps {
  removal: Removal;
  onClick: () => void;
  orderNumber?: number;
}

// Config for status badge
const statusConfig: { [key in RemovalStatus]?: { color: string; icon: React.ElementType; label: string } } = {
  solicitada: { color: 'blue', icon: List, label: 'Solicitada' },
  agendada: { color: 'purple', icon: Clock, label: 'Agendada' },
  concluida: { color: 'green', icon: CheckCircle, label: 'Ag. Operacional' },
  aguardando_boleto: { color: 'orange', icon: FileWarning, label: 'Ag. Boleto' },
  pagamento_concluido: { color: 'teal', icon: FileCheck, label: 'Pagamento Concluído' },
  cancelada: { color: 'red', icon: XCircle, label: 'Cancelada' },
  em_andamento: { color: 'yellow', icon: List, label: 'Em Andamento' },
  a_caminho: { color: 'yellow', icon: List, label: 'A Caminho' },
  removido: { color: 'indigo', icon: CheckCircle, label: 'Removido' },
  finalizada: { color: 'gray', icon: CheckCircle, label: 'Finalizada' },
  aguardando_baixa_master: { color: 'cyan', icon: Send, label: 'Ag. Master' },
  encaminhado_master: { color: 'purple', icon: Send, label: 'Encaminhado Master' },
  aguardando_financeiro_junior: { color: 'orange', icon: FileWarning, label: 'Ag. Fin. Jr.' },
  aguardando_venda_receptor: { color: 'pink', icon: ShoppingBag, label: 'Ag. Venda' },
  aguardando_producao_adicionais: { color: 'purple', icon: HardHat, label: 'Ag. Produção' },
  lembrancinha_feita: { color: 'purple', icon: ClipboardCheck, label: 'Lembrancinha Feita' },
  cremado: { color: 'gray', icon: Flame, label: 'Cremado' },
  pronto_para_entrega: { color: 'pink', icon: PackageCheck, label: 'Pronto p/ Entrega' },
  aguardando_retirada: { color: 'orange', icon: UserCheck, label: 'Ag. Retirada' },
  entrega_agendada: { color: 'cyan', icon: CalendarClock, label: 'Entrega Agendada' },
  entrega_a_caminho: { color: 'purple', icon: Truck, label: 'Entrega a Caminho' },
};

// New config for modality styling
const modalityConfig: { [key: string]: { style: string; label: string } } = {
  coletivo: { style: 'bg-green-200 text-green-800', label: 'Coletivo' },
  individual_prata: { style: 'bg-gray-300 text-gray-800', label: 'Individual Prata' },
  individual_ouro: { style: 'bg-amber-300 text-amber-800', label: 'Individual Ouro' },
  '': { style: 'bg-gray-200 text-gray-800', label: 'Não Definida' }
};

const RemovalCard: React.FC<RemovalCardProps> = ({ removal, onClick, orderNumber }) => {
  const { user } = useAuth();

  const isContactedByFinance = user?.role === 'financeiro_junior' && removal.contactedByFinance;

  const statusStyle = statusConfig[removal.status] || { color: 'gray', icon: Files, label: 'Desconhecido' };
  const StatusIcon = statusStyle.icon;
  const displayColor = isContactedByFinance ? 'green' : statusStyle.color;

  const modalityStyle = modalityConfig[removal.modality] || modalityConfig[''];
  
  const cardClasses = [
    "bg-white rounded-lg shadow-md p-4 transition-all hover:shadow-lg cursor-pointer border-l-8 relative",
    removal.isPriority ? "border-red-500" : "border-transparent"
  ].join(" ");

  return (
    <div 
      className={cardClasses}
      onClick={onClick}
    >
      {orderNumber && (
        <div className="absolute -top-3 -left-3 bg-blue-600 text-white h-9 w-9 rounded-full flex items-center justify-center font-bold text-lg shadow-lg border-2 border-white z-10">
          {orderNumber}
        </div>
      )}
      <div className="flex justify-between items-start">
        <div className="flex-grow">
          <p className="font-mono font-bold text-blue-700 text-sm bg-blue-100 px-2.5 py-1 rounded-full inline-block mb-2">
            {removal.code || <span className="text-yellow-600">Pendente</span>}
          </p>
          <h4 className="text-lg font-bold text-gray-800 truncate" title={removal.pet.name}>{removal.pet.name}</h4>
          <p className="text-sm text-gray-600">Tutor: {removal.tutor.name}</p>
        </div>
        <div className="flex flex-col items-end gap-2 flex-shrink-0 ml-2">
            {removal.isPriority && (
                <div className="flex items-center text-xs font-bold text-red-600 bg-red-100 px-2 py-1 rounded-full animate-pulse">
                    <AlertTriangle className="h-4 w-4 mr-1" />
                    PRIORIDADE
                </div>
            )}
            <div className={`flex items-center text-sm font-medium text-${displayColor}-600 bg-${displayColor}-100 px-2 py-1 rounded-full`}>
              <StatusIcon className="h-4 w-4 mr-1" />
              {statusStyle.label}
            </div>
        </div>
      </div>
      <div className="mt-4 text-sm space-y-2">
        <div>
            <span className={`${modalityStyle.style} font-semibold px-2 py-0.5 rounded-md`}>
                {modalityStyle.label}
            </span>
        </div>
        <p className="text-gray-800 pt-1"><strong>Valor:</strong> R$ {removal.value.toFixed(2)}</p>
        <p className="text-gray-700"><strong>Data:</strong> {format(new Date(removal.createdAt), 'dd/MM/yyyy HH:mm')}</p>
      </div>
      <div className="mt-3 flex justify-end">
        <button className="text-sm text-blue-600 hover:text-blue-800 flex items-center">
            <Eye className="h-4 w-4 mr-1" />
            Ver Detalhes
        </button>
      </div>
    </div>
  );
};

export default RemovalCard;
