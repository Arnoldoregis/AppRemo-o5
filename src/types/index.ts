export interface User {
  id: string;
  email: string;
  name: string; // Nome da pessoa ou Nome Fantasia da clínica
  userType: 'pessoa_fisica' | 'clinica' | 'funcionario';
  role?: 'administrador' | 'receptor' | 'motorista' | 'financeiro_junior' | 'financeiro_master' | 'gerencia' | 'operacional' | 'cremador' | 'agenda_despedida' | 'representante';
  cpf?: string;
  cnpj?: string;
  phone: string;
  address: Address;
}

export interface Address {
  cep: string;
  street: string;
  number: string;
  neighborhood: string;
  city: string;
  state: string;
}

export interface Pet {
  name: string;
  species: 'cachorro' | 'gato' | 'roedor' | 'passaro' | 'outros' | '';
  breed: string;
  gender: 'macho' | 'femea' | '';
  weight: string;
  causeOfDeath: string;
}

export type RemovalStatus = 
  | 'solicitada'          // Cliente criou
  | 'recebida'            // Receptor viu
  | 'agendada'            // Cliente agendou
  | 'em_andamento'        // Receptor direcionou para motorista
  | 'a_caminho'           // Motorista aceitou
  | 'removido'            // Motorista coletou o pet
  | 'concluida'           // Motorista pesou e finalizou -> Agora vai para o Operacional
  | 'encaminhado_master'  // Operacional encaminhou para o Financeiro Master
  | 'aguardando_financeiro_junior' // Operacional finalizou -> Vai para o Financeiro Jr.
  | 'aguardando_venda_receptor' // Fin. Master encaminhou para o Receptor vender adicionais
  | 'aguardando_producao_adicionais' // Receptor vendeu e encaminhou para o Operacional produzir
  | 'lembrancinha_feita' // Operacional fez a lembrancinha, aguardando secar
  | 'aguardando_baixa_master' // Financeiro Jr. finalizou -> Vai para o Master
  | 'aguardando_pagamento'// Financeiro Master gerou boleto
  | 'pagamento_concluido' // Cliente pagou boleto / Fin Master confirmou
  | 'cancelada'           // Cancelado em alguma etapa
  | 'finalizada'          // Ciclo encerrado pelo Financeiro / Liberado para cremação pelo Operacional
  | 'em_lote_cremacao'    // Adicionado a um lote de cremação, aguardando início
  | 'cremado'             // Cremador marcou como cremado -> Vai para Montar Sacola
  | 'pronto_para_entrega' // Sacola montada -> Vai para Fin. Jr. notificar
  | 'aguardando_retirada' // Tutor virá buscar
  | 'entrega_agendada'    // Entrega será agendada
  | 'entrega_a_caminho'   // Motorista está a caminho para entregar
  | 'aguardando_boleto'   // Status para a visão da clínica
  | 'coletivo_pago'
  | 'individual_pago'
  | 'coletivo_faturado'
  | 'individual_faturado';

export type DeliveryStatus = 'ready_for_scheduling' | 'scheduled' | 'awaiting_pickup' | 'out_for_delivery' | 'delivered';

export interface Removal {
  id: string;
  code: string;
  contractNumber: string;
  createdById: string; // ID do usuário (PF ou Clínica) que criou
  clinicName?: string; // Nome da clínica, se aplicável
  clinicCnpj?: string;
  clinicPhone?: string;
  modality: 'coletivo' | 'individual_prata' | 'individual_ouro' | 'plano_preventivo' | '';
  tutor: {
    cpfOrCnpj: string;
    name: string;
    phone: string;
    email: string;
  };
  pet: Pet;
  removalAddress: Address;
  deliveryAddress?: Address;
  additionals: Additional[];
  customAdditionals?: CustomAdditional[];
  paymentMethod: 'faturado' | 'debito' | 'credito' | 'pix' | 'link_pagamento' | 'dinheiro' | 'plano_preventivo' | 'boleto' | 'debito_automatico' | '';
  value: number;
  observations: string;
  requestType: 'agora' | 'agendar';
  scheduledDate?: string;
  scheduledTime?: string;
  schedulingReason?: string;
  status: RemovalStatus;
  history: RemovalHistory[];
  realWeight?: number;
  paymentProof?: string; // URL ou path do arquivo
  cancellationReason?: string;
  createdAt: string; // Data de criação da solicitação
  assignedDriver?: {
    id: string;
    name: string;
    phone?: string;
  };
  assignedFinanceiroJunior?: {
    id: string;
    name: string;
  };
  assignedFinanceiroMaster?: {
    id: string;
    name: string;
  };
  representativeId?: string;
  representativeName?: string;
  boletoUrl?: string;
  comprovanteFaturaUrl?: string;
  adjustmentConfirmed?: boolean;
  petCondition?: string;
  farewellSchedulingInfo?: string;
  cremationDate?: string;
  cremationCompany?: 'PETCÈU' | 'SQP';
  certificateObservations?: string;
  contactedByFinance?: boolean;
  bagAssemblyDetails?: {
    standardUrn: {
      included: boolean;
      productId?: string;
      productName?: string;
      quantity?: number;
    };
    pawPrint: {
      included: boolean;
      productId?: string;
      productName?: string;
      quantity?: number;
    };
  };
  scheduledDeliveryDate?: string;
  deliveryItems?: string[];
  deliveryPerson?: string;
  isPriority?: boolean;
  priorityDeadline?: string;
  emergencyFee?: number;
  hasContract?: boolean;
  preventivePlanDetails?: {
    pets: {
      id: number;
      nome: string;
      especie: string;
      sexo: string;
      peso: string;
      raca: string;
      modalidade: string;
      valor: number;
      products: { id: string; name: string; price: number }[];
    }[];
    adhesionFee: number;
  };
  deliveryStatus?: DeliveryStatus;
}

export interface Additional {
  type: 'patinha_resina' | 'relicario' | 'carteirinha_pelinho';
  quantity: number;
  value: number;
}

export interface CustomAdditional {
  id: string;
  name: string;
  value: number;
  paymentProof?: string;
}

export interface RemovalHistory {
  date: string;
  action: string;
  user: string;
  reason?: string;
  proofUrl?: string;
}

export interface LoteFaturamento {
  id: string; // e.g., 'clinic_456-2025-07'
  clinicId: string;
  clinicName: string;
  removals: Removal[];
  totalValue: number;
  status: 'aguardando_geracao_boleto' | 'aguardando_pagamento_clinica' | 'pagamento_em_confirmacao' | 'concluido';
  boletoUrl?: string;
  comprovanteUrl?: string;
}

export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  text: string;
  timestamp: string;
  attachment?: {
    name: string;
    url: string;
  };
}

export interface Conversation {
  id: string; // Corresponds to client's userId
  clientName: string;
  messages: ChatMessage[];
  unreadByReceptor: number;
  unreadByClient: number;
  lastMessageTimestamp: string;
}

export interface FarewellSchedule {
  [slotKey: string]: Removal; // key is "YYYY-MM-DD-HH:mm" or "YYYY-MM-DD-ENCAIXE EMERGÊNCIA"
}

export type CremationPosition = 'frente' | 'meio/frente' | 'meio' | 'meio/fundo' | 'fundo';

export interface CremationBatchItem {
  removalCode: string;
  petName: string;
  weight: number;
  position: CremationPosition;
}

export interface CremationBatch {
  id: string;
  createdAt: string;
  startedAt?: string;
  finishedAt?: string;
  items: CremationBatchItem[];
}

export type StockCategory = 'material_venda' | 'material_escritorio' | 'material_limpeza' | 'sob_encomenda';

export interface StockItem {
  id: string;
  trackingCode: string;
  name: string;
  category: StockCategory;
  quantity: number;
  unitDescription?: string; // Ex: "Caixa c/ 100", "Pacote"
  sellingPrice: number;
  createdAt: string;
  minAlertQuantity?: number;
}

export type PriceRegion = 'curitiba_rm' | 'litoral' | 'sc';
export type PetSpeciesType = 'normal' | 'exotico';
export type BillingType = 'faturado' | 'nao_faturado';

export type NextTask = Removal & { taskType: 'removal' | 'delivery' };

export interface VisitAddress {
  cep: string;
  street: string;
  number: string;
  neighborhood: string;
  city: string;
  state: string;
}

export interface Visit {
  id: number;
  name: string;
  contact?: string;
  date: string;
  time: string;
  status: 'Agendada' | 'Concluída' | 'Cancelada';
  address: VisitAddress;
}
