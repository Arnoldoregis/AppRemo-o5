import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Removal } from '../types';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export const generateDeliveryReportPdf = (date: string, removals: Removal[]) => {
  const doc = new jsPDF();
  const formattedDate = format(new Date(date + 'T00:00:00'), "dd 'de' MMMM 'de' yyyy", { locale: ptBR });

  // Título
  doc.setFontSize(18);
  doc.text(`Relatório de Entregas - ${formattedDate}`, 14, 22);

  const tableColumn = ["Código", "Pet", "Tutor", "Endereço", "Telefone", "Produtos", "Entregador"];
  const tableRows: (string | undefined)[][] = [];

  removals.forEach(removal => {
    const address = removal.deliveryAddress || removal.removalAddress;
    const fullAddress = `${address.street}, ${address.number}, ${address.neighborhood}, ${address.city} - ${address.state}`;
    const products = removal.deliveryItems?.join(', ') || 'N/A';
    
    const removalData = [
      removal.code,
      removal.pet.name,
      removal.tutor.name,
      fullAddress,
      removal.tutor.phone,
      products,
      removal.deliveryPerson,
    ];
    tableRows.push(removalData);
  });

  autoTable(doc, {
    head: [tableColumn],
    body: tableRows,
    startY: 30,
    theme: 'striped',
    headStyles: { fillColor: [39, 174, 96] }, // Um tom de verde
    styles: {
        fontSize: 8,
        cellPadding: 2,
    },
  });

  doc.save(`relatorio_entregas_${date}.pdf`);
};
