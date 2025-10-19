export const priceTable = {
  '0-5kg': {
    coletivo: 207.00,
    individual_prata: 480.00,
    individual_ouro: 500.00,
  },
  '6-10kg': {
    coletivo: 230.00,
    individual_prata: 780.00,
    individual_ouro: 830.00,
  },
  '11-20kg': {
    coletivo: 255.00,
    individual_prata: 830.00,
    individual_ouro: 890.00,
  },
  '21-40kg': {
    coletivo: 285.00,
    individual_prata: 850.00,
    individual_ouro: 999.00,
  },
  '41-50kg': {
    coletivo: 330.00,
    individual_prata: 870.00,
    individual_ouro: 1060.00,
  },
  '51-60kg': {
    coletivo: 370.00,
    individual_prata: 890.00,
    individual_ouro: 1190.00,
  },
  '61-80kg': {
    coletivo: 400.00,
    individual_prata: 1070.00,
    individual_ouro: 1350.00,
  },
};

export const adicionaisDisponiveis = [
    { type: 'patinha_resina' as const, label: 'Patinha em resina', value: 150 },
    { type: 'relicario' as const, label: 'Relicário', value: 200 },
    { type: 'carteirinha_pelinho' as const, label: 'Carteirinha com pelinho', value: 50 }
];

export const collectiveAdditionals = [
    { id: 'carteirinha', name: 'CARTEIRINHA COM PELINHO', value: 50 },
    { id: 'patinha', name: 'PATINHA', value: 150 },
    { id: 'relicario', name: 'RELICÁRIO', value: 200 },
    { id: 'pingente', name: 'PINGENTE EM RESINA', value: 250 },
];
