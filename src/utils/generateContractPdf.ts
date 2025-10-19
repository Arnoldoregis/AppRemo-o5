import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Removal } from '../types';
import { format } from 'date-fns';

export const generateContractPdf = (removal: Partial<Removal>) => {
  const doc = new jsPDF();

  const isClinicRequest = !!removal.clinicName && removal.modality !== 'plano_preventivo';
  const isPreventivePlan = removal.modality === 'plano_preventivo';

  const s = (value: any, fallback: string = 'N/A'): string => {
    if (value === null || typeof value === 'undefined' || String(value).trim() === '') {
        return fallback;
    }
    return String(value);
  };

  // Header
  doc.setFontSize(18);
  doc.text(isPreventivePlan ? 'CONTRATO DE PLANO PREVENTIVO' : 'CONTRATO DE PRESTAÇÃO DE SERVIÇOS DE REMOÇÃO', 105, 20, { align: 'center' });
  doc.setFontSize(12);
  doc.text(`Contrato Nº: ${s(removal.contractNumber, 'PENDENTE')}`, 14, 30);
  doc.text(`Data: ${format(new Date(), 'dd/MM/yyyy HH:mm')}`, 196, 30, { align: 'right' });

  let finalY = 35;

  // Parties
  const addressParts = [
    s(removal.removalAddress?.street, ''),
    s(removal.removalAddress?.number, ''),
    s(removal.removalAddress?.neighborhood, ''),
    s(removal.removalAddress?.city, ''),
    s(removal.removalAddress?.state, ''),
  ].filter(Boolean).join(', ');

  const contratanteData = isClinicRequest
    ? `Razão Social: ${s(removal.clinicName)}\nCNPJ: ${s(removal.clinicCnpj)}\nEndereço: ${s(addressParts, 'Não informado')}\nContato: ${s(removal.clinicPhone)}`
    : `Nome: ${s(removal.tutor?.name)}\nCPF/CNPJ: ${s(removal.tutor?.cpfOrCnpj)}\nEndereço: ${s(addressParts, 'Não informado')}\nContato: ${s(removal.tutor?.phone)}`;
  
  const contratadaData = 'PET ANJINHO LTDA\nCNPJ: XX.XXX.XXX/0001-XX\nEndereço: Rua Santa Helena 51, Centro, Pinhais\nContato: (41) XXXX-XXXX';

  autoTable(doc, {
    startY: finalY,
    head: [['CONTRATANTE', 'CONTRATADA']],
    body: [[contratanteData, contratadaData]],
    theme: 'striped',
    styles: { fontSize: 9, cellPadding: 2 },
    didDrawPage: (data) => {
        finalY = data.cursor?.y || finalY;
    }
  });

  // Third Party Beneficiary
  if (isClinicRequest) {
    autoTable(doc, {
      startY: finalY + 2,
      head: [['TERCEIRO BENEFICIÁRIO (TUTOR)']],
      body: [[`Nome: ${s(removal.tutor?.name)}\nContato: ${s(removal.tutor?.phone)}`]],
      theme: 'striped',
      styles: { fontSize: 9, cellPadding: 2 },
      didDrawPage: (data) => {
        finalY = data.cursor?.y || finalY;
      }
    });
  }

  // Object
  finalY += 5;
  autoTable(doc, {
    startY: finalY,
    head: [['1. OBJETO DO CONTRATO']],
    body: [[
      isPreventivePlan
        ? `O presente contrato tem como objeto a prestação de serviços de cremação futura para os pets listados abaixo, na modalidade de Plano Preventivo.`
        : `O presente contrato tem como objeto a prestação de serviços de remoção do pet de nome ${s(removal.pet?.name)}, espécie ${s(removal.pet?.species)}, na modalidade ${s(removal.modality, '').replace(/_/g, ' ')}.`
    ]],
    theme: 'plain',
    headStyles: { fontSize: 12, fontStyle: 'bold' },
    bodyStyles: { fontSize: 10, cellPadding: 0 },
    didDrawPage: (data) => { finalY = data.cursor?.y || finalY; }
  });

  // Service Details
  finalY += 5;
  autoTable(doc, {
    startY: finalY,
    head: [['2. DETALHES DO SERVIÇO']],
    body: [[]], // Empty body to just draw the header
    theme: 'plain',
    headStyles: { fontSize: 12, fontStyle: 'bold' },
    didDrawPage: (data) => { finalY = data.cursor?.y || finalY; }
  });

  if (isPreventivePlan && removal.preventivePlanDetails) {
    const details = removal.preventivePlanDetails;
    const petTableBody: any[] = [];
    details.pets.forEach((pet, index) => {
      petTableBody.push([{ content: `Detalhes do Pet ${index + 1}: ${s(pet.nome)}`, colSpan: 2, styles: { fontStyle: 'bold', fillColor: '#f3f4f6' } }]);
      petTableBody.push(['Espécie / Raça', `${s(pet.especie)} / ${s(pet.raca)}`]);
      petTableBody.push(['Sexo / Peso', `${s(pet.sexo)} / ${s(pet.peso)}`]);
      petTableBody.push(['Modalidade', s(pet.modalidade, '').replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())]);
      petTableBody.push(['Produtos Adicionais', pet.products.map(p => p.name).join(', ') || 'Nenhum']);
      petTableBody.push([{ content: 'Valor Mensal do Pet', styles: { fontStyle: 'bold' } }, { content: `R$ ${pet.valor.toFixed(2)}`, styles: { halign: 'right' } }]);
    });
    autoTable(doc, {
        startY: finalY, body: petTableBody, theme: 'grid', styles: { fontSize: 9 },
        didDrawPage: (data) => { finalY = data.cursor?.y || finalY; }
    });
    
    const financeTableBody: any[] = [
        ['Taxa de Adesão', { content: `R$ ${details.adhesionFee.toFixed(2)}`, styles: { halign: 'right' } }],
        [{ content: 'Valor Total do Contrato', styles: { fontStyle: 'bold' } }, { content: `R$ ${(removal.value || 0).toFixed(2)}`, styles: { fontStyle: 'bold', halign: 'right' } }],
        ['Forma de Pagamento', s(removal.paymentMethod, '').replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())],
        ['Comprovante', removal.paymentProof ? 'Anexado' : 'Não Anexado'],
    ];
    autoTable(doc, {
        startY: finalY, body: financeTableBody, theme: 'grid', styles: { fontSize: 9 },
        columnStyles: { 0: { fontStyle: 'bold' } },
        didDrawPage: (data) => { finalY = data.cursor?.y || finalY; }
    });

  } else { // Standard removal
    autoTable(doc, {
      startY: finalY,
      body: [
          ['Modalidade', s(removal.modality, '').replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())],
          ['Adicionais', removal.additionals?.map(a => `${a.quantity}x ${s(a.type, '').replace(/_/g, ' ')}`).join(', ') || 'Nenhum'],
          ['Valor Total', `R$ ${(removal.value || 0).toFixed(2)}`],
          ['Forma de Pagamento', s(removal.paymentMethod, '').replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())],
          ['Comprovante', removal.paymentProof ? 'Anexado' : 'Não Anexado'],
      ],
      theme: 'grid',
      styles: { fontSize: 9 },
      didDrawPage: (data) => { finalY = data.cursor?.y || finalY; }
    });
  }

  // Clause
  finalY += 5;
  const clauseText = isClinicRequest
    ? `A CONTRATADA se compromete a realizar o serviço de remoção com o máximo de respeito e cuidado para o Terceiro Beneficiário (Tutor). O CONTRATANTE (Clínica) declara estar ciente e de acordo com os termos da modalidade escolhida, incluindo os procedimentos de cremação e devolução de cinzas (se aplicável). Este documento serve como comprovante da solicitação do serviço.`
    : 'A CONTRATADA se compromete a realizar o serviço contratado com o máximo de respeito e cuidado. O CONTRATANTE declara estar ciente e de acordo com os termos da modalidade escolhida, incluindo os procedimentos de cremação e devolução de cinzas (se aplicável). Este documento serve como comprovante da solicitação do serviço.';
  autoTable(doc, {
    startY: finalY,
    head: [['3. CLÁUSULAS GERAIS']],
    body: [[clauseText]],
    theme: 'plain',
    headStyles: { fontSize: 12, fontStyle: 'bold' },
    bodyStyles: { fontSize: 8, cellPadding: 0 },
    didDrawPage: (data) => { finalY = data.cursor?.y || finalY; }
  });
  
  // Signatures
  let signatureY = finalY + 20;
  if (signatureY > doc.internal.pageSize.height - 40) {
    doc.addPage();
    signatureY = 40;
  }

  doc.setFontSize(10);
  const contratanteName = isClinicRequest ? s(removal.clinicName, 'CONTRATANTE') : s(removal.tutor?.name, 'CONTRATANTE');
  doc.text('_________________________', 55, signatureY, { align: 'center' });
  doc.text(contratanteName, 55, signatureY + 5, { align: 'center' });

  const representativeName = removal.representativeName;
  
  if (representativeName) {
    // Name above the line
    doc.text(s(representativeName), 150, signatureY - 3, { align: 'center' });
  }
  // The line
  doc.text('_________________________', 150, signatureY, { align: 'center' });
  // Company below the line
  doc.text('PET ANJINHO LTDA', 150, signatureY + 5, { align: 'center' });


  // Save
  let fileName = `contrato_${s(removal.code, 'temp')}.pdf`;
  if (isPreventivePlan) {
    const tutorName = s(removal.tutor?.name, 'tutor').replace(/\s+/g, '_');
    const contractCode = s(removal.code, 'contrato');
    fileName = `Contrato_preventivo_${tutorName}_${contractCode}.pdf`;
  }
  doc.save(fileName);
};
