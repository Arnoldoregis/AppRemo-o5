import { Removal, CremationBatch } from '../types';
import * as XLSX from 'xlsx';
import { format } from 'date-fns';

export const exportToExcel = (removals: Removal[], fileName: string) => {
  if (removals.length === 0) {
    alert('Não há dados para exportar.');
    return;
  }
  const formattedData = removals.map(r => ({
    'Código': r.code,
    'Data Solicitação': format(new Date(r.createdAt), 'dd/MM/yyyy HH:mm'),
    'Status': r.status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
    'Clínica': r.clinicName || 'N/A',
    'Tutor': r.tutor.name,
    'CPF/CNPJ Tutor': r.tutor.cpfOrCnpj,
    'Contato Tutor': r.tutor.phone,
    'Pet': r.pet.name,
    'Espécie': r.pet.species,
    'Peso Solicitado': r.pet.weight,
    'Peso Real (kg)': r.realWeight || 'N/A',
    'Modalidade': r.modality.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
    'Valor Total (R$)': r.value.toFixed(2),
    'Forma de Pagamento': r.paymentMethod.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
    'Motorista': r.assignedDriver?.name || 'N/A',
    'Observações': r.observations,
    'Motivo Cancelamento': r.cancellationReason || 'N/A',
  }));

  const worksheet = XLSX.utils.json_to_sheet(formattedData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Histórico de Remoções');

  // Auto-ajustar a largura das colunas
  const colWidths = Object.keys(formattedData[0] || {}).map(key => ({
    wch: Math.max(
      key.length,
      ...formattedData.map(row => (row[key as keyof typeof row] || '').toString().length)
    ) + 2
  }));
  worksheet['!cols'] = colWidths;

  XLSX.writeFile(workbook, `${fileName}.xlsx`);
};

export const exportCremationHistoryToExcel = (batches: CremationBatch[], fileName: string) => {
  const formattedData = batches.flatMap(batch => 
    batch.items.map(item => ({
      'Lote ID': batch.id,
      'Data Início Cremação': batch.startedAt ? format(new Date(batch.startedAt), 'dd/MM/yyyy HH:mm') : 'N/A',
      'Data Fim Cremação': batch.finishedAt ? format(new Date(batch.finishedAt), 'dd/MM/yyyy HH:mm') : 'Em andamento',
      'Nome do Operador': batch.operatorName || 'N/A',
      'Nome do Pet': item.petName,
      'Código Remoção': item.removalCode,
      'Peso (kg)': item.weight.toFixed(2),
      'Posição no Forno': item.position.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
    }))
  );

  if (formattedData.length === 0) {
    alert('Nenhuma cremação finalizada na semana para exportar.');
    return;
  }

  const worksheet = XLSX.utils.json_to_sheet(formattedData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Histórico de Cremação');

  const colWidths = Object.keys(formattedData[0]).map(key => ({
    wch: Math.max(
      key.length,
      ...formattedData.map(row => (row[key as keyof typeof row] || '').toString().length)
    ) + 2
  }));
  worksheet['!cols'] = colWidths;

  XLSX.writeFile(workbook, `${fileName}.xlsx`);
};
