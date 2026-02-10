import { faker } from '@faker-js/faker';
import { Removal, RemovalStatus, User, Address } from '../types';
import { v4 as uuidv4 } from 'uuid';
import { format } from 'date-fns';

export const mockDrivers = [
  { id: 'motorista_1', name: 'Fernando', email: 'motorista@gmail.com', phone: '41984938295' },
  { id: 'motorista_2', name: 'Mariana Lima', email: 'motorista2@example.com', phone: '41999998888' },
  { id: 'motorista_3', name: 'Ricardo Andrade', email: 'motorista3@example.com', phone: '41977776666' },
];

export const mockFinanceiroJuniors = [
  { id: 'func_financeiro_junior_1', name: 'Ana Costa (Fin. Jr.)', email: 'financeirojunior@gmail.com' },
  { id: 'func_financeiro_junior_2', name: 'Bruno Alves (Fin. Jr.)', email: 'financeirojunior2@gmail.com' },
];

export const mockOperacionais = [
  { id: 'func_operacional_1', name: 'Fernando', email: 'operacional@gmail.com' },
  { id: 'func_operacional_2', name: 'Rafael', email: 'operacional2@gmail.com' },
];

export const mockRegisteredClinics: User[] = [
  { id: 'clinic_1', name: 'Clínica Vet Top (Teste)', cnpj: '11.222.333/0001-44', phone: '(41) 3333-4444', email: 'clinic1@test.com', userType: 'clinica', address: { cep: '81000-100', street: 'Avenida das Clínicas', number: '789', neighborhood: 'Batel', city: 'Curitiba', state: 'PR' } },
  { id: 'clinic_2', name: 'Clínica Amigo Fiel', cnpj: '22.333.444/0001-55', phone: '(41) 3444-5555', email: 'clinic2@test.com', userType: 'clinica', address: { cep: '82000-200', street: 'Rua dos Animais', number: '123', neighborhood: 'Santa Felicidade', city: 'Curitiba', state: 'PR' } },
  { id: 'clinic_3', name: 'Clínica Parceira (Teste)', cnpj: '33.444.555/0001-66', phone: '(41) 3555-6666', email: 'clinic3@test.com', userType: 'clinica', address: { cep: '83005-000', street: 'Avenida das Torres', number: '456', neighborhood: 'Centro', city: 'São José dos Pinhais', state: 'PR' } },
  { id: 'clinic_4', name: 'Hospital Veterinário Curitiba', cnpj: '44.555.666/0001-77', phone: '(41) 3666-7777', email: 'clinic4@test.com', userType: 'clinica', address: { cep: '80530-000', street: 'Rua Mateus Leme', number: '789', neighborhood: 'Centro Cívico', city: 'Curitiba', state: 'PR' } },
];

// List of valid addresses in Curitiba
const curitibaAddresses: Address[] = [
  { street: 'Rua XV de Novembro', number: '1000', neighborhood: 'Centro', city: 'Curitiba', state: 'PR', cep: '80060-000' },
  { street: 'Avenida Sete de Setembro', number: '2775', neighborhood: 'Rebouças', city: 'Curitiba', state: 'PR', cep: '80230-000' },
  { street: 'Rua Marechal Deodoro', number: '630', neighborhood: 'Centro', city: 'Curitiba', state: 'PR', cep: '80010-010' },
  { street: 'Alameda Dr. Carlos de Carvalho', number: '975', neighborhood: 'Batel', city: 'Curitiba', state: 'PR', cep: '80730-200' },
  { street: 'Avenida República Argentina', number: '3330', neighborhood: 'Portão', city: 'Curitiba', state: 'PR', cep: '80610-260' },
  { street: 'Rua Padre Anchieta', number: '2050', neighborhood: 'Bigorrilho', city: 'Curitiba', state: 'PR', cep: '80730-000' },
  { street: 'Avenida Victor Ferreira do Amaral', number: '2940', neighborhood: 'Tarumã', city: 'Curitiba', state: 'PR', cep: '82810-350' },
  { street: 'Rua Francisco Rocha', number: '198', neighborhood: 'Batel', city: 'Curitiba', state: 'PR', cep: '80420-130' },
  { street: 'Rua Professor Pedro Viriato Parigot de Souza', number: '600', neighborhood: 'Mossunguê', city: 'Curitiba', state: 'PR', cep: '81200-100' },
  { street: 'Avenida Presidente Kennedy', number: '4121', neighborhood: 'Portão', city: 'Curitiba', state: 'PR', cep: '80610-010' },
];

export const generateMockRemovals = (): Removal[] => {
    const mockRemovals: Removal[] = [];
    const statuses: RemovalStatus[] = [
      'solicitada', 'agendada', 'concluida', 'aguardando_boleto', 'pagamento_concluido', 'cancelada', 
      'em_andamento', 'a_caminho', 'removido', 'finalizada', 'aguardando_baixa_master'
    ];
    const owners = ['clinic_456', 'pf_123'];
    const drivers = [
        { id: 'motorista_1', name: 'Fernando', phone: '41984938295' },
        { id: 'motorista_2', name: 'Mariana Lima', phone: '41999998888' },
    ];

    // Gerar 2 remoções para o Financeiro Junior (Coletivo)
    for (let i = 0; i < 2; i++) {
        mockRemovals.push({
            id: uuidv4(),
            code: `FINJR_COLETIVO_${i+1}`,
            contractNumber: `A${(i + 1).toString().padStart(8, '0')}`,
            createdById: 'clinic_456',
            clinicName: 'Clínica Amigo Fiel',
            modality: 'coletivo',
            tutor: { name: faker.person.fullName(), cpfOrCnpj: faker.finance.accountNumber(11), phone: faker.phone.number(), email: faker.internet.email() },
            pet: { name: faker.animal.cat(), species: 'gato', breed: 'SRD', gender: 'femea', weight: '0-5kg', causeOfDeath: 'Natural' },
            removalAddress: curitibaAddresses[i % curitibaAddresses.length],
            additionals: [],
            paymentMethod: 'pix',
            value: 207.00,
            observations: 'Tutor ciente do processo coletivo.',
            requestType: 'agora',
            status: 'aguardando_financeiro_junior',
            history: [
                { date: faker.date.past().toISOString(), action: 'Solicitação criada', user: 'Clínica Amigo Fiel' },
                { date: faker.date.recent().toISOString(), action: 'Encaminhado para Financeiro Junior', user: 'Operacional (Teste)' },
            ],
            createdAt: faker.date.recent({ days: 2 }).toISOString(),
            realWeight: 4.8,
            contactedByFinance: false,
            assignedFinanceiroJunior: { id: 'func_financeiro_junior_1', name: 'Financeiro Junior 1 (Teste)' },
        });
    }

    // Gerar 2 remoções para o Financeiro Junior (Individual)
    for (let i = 0; i < 2; i++) {
        mockRemovals.push({
            id: uuidv4(),
            code: `FINJR_INDIVIDUAL_${i+1}`,
            contractNumber: `A${(i + 3).toString().padStart(8, '0')}`,
            createdById: 'pf_123',
            modality: i % 2 === 0 ? 'individual_ouro' : 'individual_prata',
            tutor: { name: faker.person.fullName(), cpfOrCnpj: faker.finance.accountNumber(11), phone: faker.phone.number(), email: faker.internet.email() },
            pet: { name: faker.animal.dog(), species: 'cachorro', breed: 'Golden Retriever', gender: 'macho', weight: '21-40kg', causeOfDeath: 'Idade avançada' },
            removalAddress: curitibaAddresses[(i + 2) % curitibaAddresses.length],
            additionals: [],
            paymentMethod: 'credito',
            value: i % 2 === 0 ? 999.00 : 850.00,
            observations: 'Aguardando contato para agendamento da despedida.',
            requestType: 'agora',
            status: 'aguardando_financeiro_junior',
            history: [
                { date: faker.date.past().toISOString(), action: 'Solicitação criada', user: 'Tutor (Teste)' },
                { date: faker.date.recent().toISOString(), action: 'Encaminhado para Financeiro Junior', user: 'Operacional (Teste)' },
            ],
            createdAt: faker.date.recent({ days: 3 }).toISOString(),
            realWeight: 35,
            petCondition: 'Corpo em bom estado, mantido refrigerado.',
            farewellSchedulingInfo: 'Tutor prefere horários na parte da tarde.',
            contactedByFinance: false,
            assignedFinanceiroJunior: { id: 'func_financeiro_junior_1', name: 'Financeiro Junior 1 (Teste)' },
        });
    }

    // NOVOS DADOS PARA TESTE DO FINANCEIRO JUNIOR
    const testRemovalsForFinJr: Removal[] = [
        {
            id: uuidv4(),
            code: `TESTE_FINJR_COLETIVO_FATURADO`,
            contractNumber: `A${(5).toString().padStart(8, '0')}`,
            createdById: 'clinic_456',
            clinicName: 'Clínica Vet+',
            modality: 'coletivo',
            tutor: { name: 'Ana Paula', cpfOrCnpj: faker.finance.accountNumber(11), phone: faker.phone.number(), email: faker.internet.email() },
            pet: { name: 'Frajola', species: 'gato', breed: 'SRD', gender: 'macho', weight: '0-5kg', causeOfDeath: 'Atropelamento' },
            removalAddress: { street: 'Avenida República Argentina', number: '1505', neighborhood: 'Água Verde', city: 'Curitiba', state: 'PR', cep: '80620-010' },
            additionals: [],
            paymentMethod: 'faturado',
            value: 207.00,
            observations: 'Remoção faturada para clínica.',
            requestType: 'agora',
            status: 'aguardando_financeiro_junior',
            history: [
                { date: faker.date.recent({days: 1}).toISOString(), action: 'Encaminhado para Financeiro Junior', user: 'Operacional (Teste)' },
            ],
            createdAt: faker.date.recent({ days: 2 }).toISOString(),
            realWeight: 3.2,
            contactedByFinance: true,
            assignedFinanceiroJunior: { id: 'func_financeiro_junior_1', name: 'Financeiro Junior 1 (Teste)' },
        },
        {
            id: uuidv4(),
            code: `TESTE_FINJR_INDIVIDUAL_SEM_CONTATO`,
            contractNumber: `A${(6).toString().padStart(8, '0')}`,
            createdById: 'pf_123',
            modality: 'individual_prata',
            tutor: { name: 'Carlos Eduardo', cpfOrCnpj: faker.finance.accountNumber(11), phone: faker.phone.number(), email: faker.internet.email() },
            pet: { name: 'Rex', species: 'cachorro', breed: 'Pastor Alemão', gender: 'macho', weight: '21-40kg', causeOfDeath: 'Insuficiência renal' },
            removalAddress: { street: 'Rua Francisco Rocha', number: '198', neighborhood: 'Batel', city: 'Curitiba', state: 'PR', cep: '80420-130' },
            additionals: [],
            paymentMethod: 'pix',
            value: 850.00,
            observations: 'Tutor muito abalado, aguardando contato.',
            requestType: 'agora',
            status: 'aguardando_financeiro_junior',
            history: [
                 { date: faker.date.recent({days: 1}).toISOString(), action: 'Encaminhado para Financeiro Junior', user: 'Operacional (Teste)' },
            ],
            createdAt: faker.date.recent({ days: 1 }).toISOString(),
            realWeight: 38,
            petCondition: 'Corpo em bom estado.',
            farewellSchedulingInfo: 'Tutor solicitou contato para agendar despedida.',
            contactedByFinance: false,
            assignedFinanceiroJunior: { id: 'func_financeiro_junior_1', name: 'Financeiro Junior 1 (Teste)' },
        },
        {
            id: uuidv4(),
            code: `TESTE_FINJR_FINALIZADA`,
            contractNumber: `A${(7).toString().padStart(8, '0')}`,
            createdById: 'pf_123',
            modality: 'individual_ouro',
            tutor: { name: 'Mariana Costa', cpfOrCnpj: faker.finance.accountNumber(11), phone: faker.phone.number(), email: faker.internet.email() },
            pet: { name: 'Luna', species: 'gato', breed: 'Siamês', gender: 'femea', weight: '0-5kg', causeOfDeath: 'Idade' },
            removalAddress: { street: 'Rua Padre Anchieta', number: '2050', neighborhood: 'Bigorrilho', city: 'Curitiba', state: 'PR', cep: '80730-000' },
            additionals: [],
            paymentMethod: 'credito',
            value: 500.00,
            observations: 'Tudo ok.',
            requestType: 'agora',
            status: 'aguardando_baixa_master',
            history: [
                { date: faker.date.past().toISOString(), action: 'Solicitação criada', user: 'Mariana Costa' },
                { date: faker.date.recent().toISOString(), action: `Financeiro Junior (Teste) finalizou e enviou para o Financeiro Master (PETCÈU)`, user: 'Financeiro Junior (Teste)' },
            ],
            createdAt: faker.date.recent({ days: 5 }).toISOString(),
            realWeight: 4.1,
            contactedByFinance: true,
            cremationCompany: 'PETCÈU',
            assignedFinanceiroMaster: { id: 'func_financeiro_master_1', name: 'Financeiro Master 1 (Teste)' },
        }
    ];
    mockRemovals.push(...testRemovalsForFinJr);

    const now = new Date();
    const lastMonth = new Date();
    lastMonth.setMonth(now.getMonth() - 1);

    const faturadoRemovals: Removal[] = [
        // Current month - Clínica Vet Top
        {
            id: uuidv4(),
            code: `FAT-CM-01`,
            contractNumber: `A${(8).toString().padStart(8, '0')}`,
            createdById: 'clinic_1',
            clinicName: 'Clínica Vet Top (Teste)',
            clinicCnpj: '11.222.333/0001-44',
            modality: 'coletivo',
            tutor: { name: faker.person.fullName(), cpfOrCnpj: faker.finance.accountNumber(11), phone: faker.phone.number(), email: faker.internet.email() },
            pet: { name: faker.animal.cat(), species: 'gato', breed: 'SRD', gender: 'femea', weight: '0-5kg', causeOfDeath: 'Natural' },
            removalAddress: curitibaAddresses[0],
            additionals: [],
            paymentMethod: 'faturado',
            value: 227.70, // 207 * 1.1 (faturado)
            observations: 'Faturado para Vet Top - Mês atual.',
            requestType: 'agora',
            status: 'aguardando_baixa_master',
            history: [{ date: now.toISOString(), action: 'Finalizado para Master', user: 'Fin. Junior' }],
            createdAt: now.toISOString(),
            assignedFinanceiroMaster: { id: 'func_financeiro_master_1', name: 'Financeiro Master 1 (Teste)' },
        },
        {
            id: uuidv4(),
            code: `FAT-CM-02`,
            contractNumber: `A${(9).toString().padStart(8, '0')}`,
            createdById: 'clinic_1',
            clinicName: 'Clínica Vet Top (Teste)',
            clinicCnpj: '11.222.333/0001-44',
            modality: 'individual_prata',
            tutor: { name: faker.person.fullName(), cpfOrCnpj: faker.finance.accountNumber(11), phone: faker.phone.number(), email: faker.internet.email() },
            pet: { name: faker.animal.dog(), species: 'cachorro', breed: 'Labrador', gender: 'macho', weight: '21-40kg', causeOfDeath: 'Idade' },
            removalAddress: curitibaAddresses[1],
            additionals: [],
            paymentMethod: 'faturado',
            value: 935.00, // 850 * 1.1
            observations: 'Faturado para Vet Top - Mês atual.',
            requestType: 'agora',
            status: 'aguardando_baixa_master',
            history: [{ date: now.toISOString(), action: 'Finalizado para Master', user: 'Fin. Junior' }],
            createdAt: now.toISOString(),
            assignedFinanceiroMaster: { id: 'func_financeiro_master_1', name: 'Financeiro Master 1 (Teste)' },
        },
        // Current month - Clínica Amigo Fiel
        {
            id: uuidv4(),
            code: `FAT-CM-03`,
            contractNumber: `A${(10).toString().padStart(8, '0')}`,
            createdById: 'clinic_2',
            clinicName: 'Clínica Amigo Fiel',
            clinicCnpj: '22.333.444/0001-55',
            modality: 'coletivo',
            tutor: { name: faker.person.fullName(), cpfOrCnpj: faker.finance.accountNumber(11), phone: faker.phone.number(), email: faker.internet.email() },
            pet: { name: faker.animal.bird(), species: 'passaro', breed: 'Calopsita', gender: 'femea', weight: '0-5kg', causeOfDeath: 'Natural' },
            removalAddress: curitibaAddresses[2],
            additionals: [],
            paymentMethod: 'faturado',
            value: 273.24, // 207 * 1.2 (exotico) * 1.1 (faturado)
            observations: 'Faturado para Amigo Fiel - Mês atual.',
            requestType: 'agora',
            status: 'aguardando_baixa_master',
            history: [{ date: now.toISOString(), action: 'Finalizado para Master', user: 'Fin. Junior' }],
            createdAt: now.toISOString(),
            assignedFinanceiroMaster: { id: 'func_financeiro_master_1', name: 'Financeiro Master 1 (Teste)' },
        },
        // Previous month - Clínica Vet Top
        {
            id: uuidv4(),
            code: `FAT-PM-01`,
            contractNumber: `A${(11).toString().padStart(8, '0')}`,
            createdById: 'clinic_1',
            clinicName: 'Clínica Vet Top (Teste)',
            clinicCnpj: '11.222.333/0001-44',
            modality: 'coletivo',
            tutor: { name: faker.person.fullName(), cpfOrCnpj: faker.finance.accountNumber(11), phone: faker.phone.number(), email: faker.internet.email() },
            pet: { name: faker.animal.cat(), species: 'gato', breed: 'SRD', gender: 'macho', weight: '6-10kg', causeOfDeath: 'Natural' },
            removalAddress: curitibaAddresses[3],
            additionals: [],
            paymentMethod: 'faturado',
            value: 253.00, // 230 * 1.1
            observations: 'Faturado para Vet Top - Mês anterior.',
            requestType: 'agora',
            status: 'aguardando_baixa_master',
            history: [{ date: lastMonth.toISOString(), action: 'Finalizado para Master', user: 'Fin. Junior' }],
            createdAt: lastMonth.toISOString(),
            assignedFinanceiroMaster: { id: 'func_financeiro_master_1', name: 'Financeiro Master 1 (Teste)' },
        },
        {
            id: uuidv4(),
            code: `FAT-PM-02`,
            contractNumber: `A${(12).toString().padStart(8, '0')}`,
            createdById: 'clinic_1',
            clinicName: 'Clínica Vet Top (Teste)',
            clinicCnpj: '11.222.333/0001-44',
            modality: 'coletivo',
            tutor: { name: faker.person.fullName(), cpfOrCnpj: faker.finance.accountNumber(11), phone: faker.phone.number(), email: faker.internet.email() },
            pet: { name: faker.animal.dog(), species: 'cachorro', breed: 'SRD', gender: 'femea', weight: '0-5kg', causeOfDeath: 'Natural' },
            removalAddress: curitibaAddresses[4],
            additionals: [],
            paymentMethod: 'faturado',
            value: 227.70, // 207 * 1.1
            observations: 'Faturado para Vet Top - Mês anterior.',
            requestType: 'agora',
            status: 'aguardando_baixa_master',
            history: [{ date: lastMonth.toISOString(), action: 'Finalizado para Master', user: 'Fin. Junior' }],
            createdAt: lastMonth.toISOString(),
            assignedFinanceiroMaster: { id: 'func_financeiro_master_1', name: 'Financeiro Master 1 (Teste)' },
        },
    ];

    mockRemovals.push(...faturadoRemovals);


    // Gerar 3 remoções faturadas para a mesma clínica
    for (let i = 0; i < 3; i++) {
        const faturadoRemoval: Removal = {
            id: uuidv4(),
            code: `FATURADO${i+1}`,
            contractNumber: `A${(i + 13).toString().padStart(8, '0')}`,
            createdById: 'clinic_456',
            clinicName: 'Clínica Vet Top (Teste)',
            modality: faker.helpers.arrayElement(['coletivo', 'individual_prata']),
            tutor: {
                name: faker.person.fullName(),
                cpfOrCnpj: faker.finance.accountNumber(11),
                phone: faker.phone.number(),
                email: faker.internet.email(),
            },
            pet: {
                name: faker.animal.cat(),
                species: 'gato',
                breed: 'SRD',
                gender: 'femea',
                weight: '0-5kg',
                causeOfDeath: 'Natural',
            },
            removalAddress: curitibaAddresses[(i + 4) % curitibaAddresses.length],
            additionals: [],
            paymentMethod: 'faturado',
            value: faker.number.int({ min: 200, max: 400 }),
            observations: 'Cliente ciente do faturamento mensal.',
            requestType: 'agora',
            status: 'encaminhado_master', // Começa aqui para o Financeiro Master agrupar
            history: [
                { date: faker.date.past().toISOString(), action: 'Solicitação criada por Clínica Vet Top (Teste)', user: 'Clínica Vet Top (Teste)' },
                { date: faker.date.recent().toISOString(), action: 'Receptor Taiane encaminhou para o motorista Fernando', user: 'Taiane (Receptor)' },
                { date: faker.date.recent().toISOString(), action: 'Motorista Fernando finalizou a remoção', user: 'Fernando (Motorista)' },
                { date: faker.date.recent().toISOString(), action: 'Encaminhado para o Financeiro Master por Operacional', user: 'Operacional (Teste)' },
            ],
            createdAt: faker.date.recent({ days: 15 }).toISOString(),
            assignedDriver: drivers[0],
            realWeight: 4.5,
            contactedByFinance: true,
            assignedFinanceiroMaster: { id: 'func_financeiro_master_1', name: 'Financeiro Master 1 (Teste)' },
        };
        mockRemovals.push(faturadoRemoval);
    }
    
    // Gerar 3 remoções coletivas para a aba "Pendentes Coletivos" do Operacional
    for (let i = 0; i < 3; i++) {
        const coletivoPendente: Removal = {
            id: uuidv4(),
            code: `COLETIVO_OP_${i+1}`,
            contractNumber: `A${(i + 16).toString().padStart(8, '0')}`,
            createdById: 'clinic_456',
            clinicName: 'Clínica Parceira (Teste)',
            modality: 'coletivo',
            tutor: {
                name: faker.person.fullName(),
                cpfOrCnpj: faker.finance.accountNumber(11),
                phone: faker.phone.number(),
                email: faker.internet.email(),
            },
            pet: {
                name: faker.animal.dog(),
                species: 'cachorro',
                breed: 'SRD',
                gender: faker.helpers.arrayElement(['macho', 'femea']),
                weight: '11-20kg',
                causeOfDeath: 'Natural',
            },
            removalAddress: { street: 'Avenida das Torres', number: `${i+1}00`, neighborhood: 'Centro', city: 'São José dos Pinhais', state: 'PR', cep: '83005-000' },
            additionals: [],
            paymentMethod: 'pix',
            value: 255,
            observations: `Exemplo de remoção coletiva pendente para o operacional ${i+1}.`,
            requestType: 'agora',
            status: 'concluida',
            history: [
                { date: faker.date.past({ days: 2 }).toISOString(), action: 'Solicitação criada pela Clínica Parceira', user: 'Clínica Parceira' },
                { date: faker.date.past({ days: 1 }).toISOString(), action: 'Receptor encaminhou para o motorista', user: 'Receptor (Teste)' },
                { date: faker.date.recent().toISOString(), action: 'Motorista finalizou a remoção e pesagem', user: 'Motorista (Teste)' },
            ],
            createdAt: faker.date.past({ days: 2 }).toISOString(),
            assignedDriver: drivers[i % drivers.length],
            realWeight: faker.number.int({ min: 12, max: 18 }),
            contactedByFinance: false,
        };
        mockRemovals.push(coletivoPendente);
    }

    // Gerar 2 remoções individuais cremadas para "Montar Sacola"
    for (let i = 0; i < 2; i++) {
        mockRemovals.push({
            id: uuidv4(),
            code: `CREMADO_IND_${i+1}`,
            contractNumber: `A${(i + 19).toString().padStart(8, '0')}`,
            createdById: 'pf_123',
            modality: 'individual_prata',
            tutor: { name: faker.person.fullName(), cpfOrCnpj: faker.finance.accountNumber(11), phone: faker.phone.number(), email: faker.internet.email() },
            pet: { name: faker.animal.dog(), species: 'cachorro', breed: 'Poodle', gender: 'femea', weight: '6-10kg', causeOfDeath: 'Idade' },
            removalAddress: curitibaAddresses[(i + 7) % curitibaAddresses.length],
            additionals: [],
            paymentMethod: 'credito',
            value: 780,
            observations: 'Aguardando montagem da sacola.',
            requestType: 'agora',
            status: 'cremado',
            history: [
                { date: faker.date.past().toISOString(), action: 'Solicitação criada', user: 'Tutor' },
                { date: faker.date.recent().toISOString(), action: 'Pet cremado no lote LOTE-12345', user: 'Operacional (Teste)' },
            ],
            createdAt: faker.date.recent({ days: 4 }).toISOString(),
            realWeight: 9.1,
            contactedByFinance: true,
            cremationCompany: 'PETCÈU',
        });
    }

    const prontoParaEntregaRemovals: Removal[] = [
        {
            id: uuidv4(),
            code: `PRONTO_1`,
            contractNumber: `A${(21).toString().padStart(8, '0')}`,
            createdById: 'pf_123',
            modality: 'individual_ouro',
            tutor: { name: 'Camila Santos', cpfOrCnpj: '111.222.333-44', phone: '41912345678', email: 'camila@example.com' },
            pet: { name: 'Thor', species: 'cachorro', breed: 'Husky Siberiano', gender: 'macho', weight: '21-40kg', causeOfDeath: 'Idade avançada' },
            removalAddress: { street: 'Rua das Flores', city: 'Curitiba', state: 'PR', cep: '80020-000', number: '100', neighborhood: 'Centro' },
            additionals: [],
            paymentMethod: 'credito',
            value: 999.00,
            observations: 'Tutor aguarda contato para retirada.',
            requestType: 'agora',
            status: 'entrega_agendada',
            deliveryPerson: 'Fernando',
            scheduledDeliveryDate: '2025-07-28',
            deliveryItems: ['Urna Padrão - G', 'Kit Patinha em Resina'],
            history: [
                { date: faker.date.recent({ days: 8 }).toISOString(), action: 'Solicitação criada', user: 'Camila Santos' },
                { date: faker.date.recent({ days: 6 }).toISOString(), action: 'Pet cremado', user: 'Cremador (Teste)' },
                { date: faker.date.recent({ days: 5 }).toISOString(), action: 'Sacola montada', user: 'Cremador (Teste)' },
            ],
            createdAt: faker.date.recent({ days: 10 }).toISOString(),
            realWeight: 28.0,
            contactedByFinance: true,
            cremationCompany: 'PETCÈU',
            cremationDate: faker.date.recent({ days: 6 }).toISOString().split('T')[0],
            bagAssemblyDetails: {
                standardUrn: { included: true, productName: 'Urna Padrão - G', quantity: 1 },
                pawPrint: { included: true, productName: 'Kit Patinha em Resina', quantity: 1 },
            },
            assignedFinanceiroJunior: { id: 'func_financeiro_junior_1', name: 'Financeiro Junior 1 (Teste)' },
        },
        {
            id: uuidv4(),
            code: `PRONTO_2`,
            contractNumber: `A${(22).toString().padStart(8, '0')}`,
            createdById: 'pf_123',
            modality: 'individual_prata',
            tutor: { name: 'Ricardo Mendes', cpfOrCnpj: '444.555.666-77', phone: '41987654321', email: 'ricardo@example.com' },
            pet: { name: 'Mia', species: 'gato', breed: 'Siamês', gender: 'femea', weight: '0-5kg', causeOfDeath: 'Natural' },
            removalAddress: { street: 'Avenida Sete de Setembro', city: 'Curitiba', state: 'PR', cep: '80230-000', number: '2000', neighborhood: 'Batel' },
            additionals: [],
            paymentMethod: 'pix',
            value: 480.00,
            observations: 'Aguardando contato para agendar entrega.',
            requestType: 'agora',
            status: 'entrega_agendada',
            deliveryPerson: 'Fernando',
            scheduledDeliveryDate: '2025-07-28',
            deliveryItems: ['Urna Padrão - P'],
            history: [
                { date: faker.date.recent({ days: 5 }).toISOString(), action: 'Solicitação criada', user: 'Ricardo Mendes' },
                { date: faker.date.recent({ days: 3 }).toISOString(), action: 'Pet cremado', user: 'Cremador (Teste)' },
                { date: faker.date.recent({ days: 2 }).toISOString(), action: 'Sacola montada', user: 'Cremador (Teste)' },
            ],
            createdAt: faker.date.recent({ days: 7 }).toISOString(),
            realWeight: 4.2,
            contactedByFinance: true,
            cremationCompany: undefined,
            cremationDate: undefined,
            bagAssemblyDetails: {
                standardUrn: { included: true, productName: 'Urna Padrão - P', quantity: 1 },
                pawPrint: { included: false },
            },
            assignedFinanceiroJunior: { id: 'func_financeiro_junior_1', name: 'Financeiro Junior 1 (Teste)' },
        },
        {
            id: uuidv4(),
            code: `PRONTO_3`,
            contractNumber: `A${(23).toString().padStart(8, '0')}`,
            createdById: 'pf_123',
            modality: 'individual_prata',
            tutor: { name: 'Juliana Ferreira', cpfOrCnpj: '888.999.000-11', phone: '41998877665', email: 'juliana@example.com' },
            pet: { name: 'Bolinha', species: 'cachorro', breed: 'Pug', gender: 'macho', weight: '6-10kg', causeOfDeath: 'Complicações cardíacas' },
            removalAddress: { street: 'Rua da Cidadania', city: 'Pinhais', state: 'PR', cep: '83323-000', number: '50', neighborhood: 'Centro' },
            additionals: [],
            paymentMethod: 'dinheiro',
            value: 780.00,
            observations: 'Tutor já foi avisado e irá retirar na unidade.',
            requestType: 'agora',
            status: 'pronto_para_entrega',
            history: [
                { date: faker.date.recent({ days: 4 }).toISOString(), action: 'Solicitação criada', user: 'Juliana Ferreira' },
                { date: faker.date.recent({ days: 2 }).toISOString(), action: 'Pet cremado', user: 'Cremador (Teste)' },
                { date: faker.date.recent({ days: 1 }).toISOString(), action: 'Sacola montada', user: 'Cremador (Teste)' },
                { date: faker.date.recent({ days: 1 }).toISOString(), action: 'Financeiro Junior (Teste) notificou o tutor sobre a retirada via WhatsApp.', user: 'Financeiro Junior (Teste)' },
            ],
            createdAt: faker.date.recent({ days: 6 }).toISOString(),
            realWeight: 9.5,
            contactedByFinance: true,
            cremationCompany: 'SQP',
            cremationDate: faker.date.recent({ days: 2 }).toISOString().split('T')[0],
            bagAssemblyDetails: {
                standardUrn: { included: true, productName: 'Urna Padrão - P', quantity: 1 },
                pawPrint: { included: false },
            },
            assignedFinanceiroJunior: { id: 'func_financeiro_junior_1', name: 'Financeiro Junior 1 (Teste)' },
        },
    ];
    
    // Adicionando as remoções coletivas para entrega conforme solicitado
    const coletivoProntoEntrega: Removal[] = [
        {
            id: uuidv4(),
            code: `COL_PRONTO_1`,
            contractNumber: `A${(60).toString().padStart(8, '0')}`,
            createdById: 'pf_123',
            modality: 'coletivo',
            tutor: { name: 'Fernanda Lima', cpfOrCnpj: faker.finance.accountNumber(11), phone: '41999887766', email: 'fernanda@example.com' },
            pet: { name: 'Rex', species: 'cachorro', breed: 'Labrador', gender: 'macho', weight: '21-40kg', causeOfDeath: 'Natural' },
            removalAddress: curitibaAddresses[5],
            additionals: [],
            customAdditionals: [
                { id: uuidv4(), name: 'PATINHA', value: 150 }
            ],
            paymentMethod: 'pix',
            value: 285.00 + 150.00,
            observations: 'Tutor quer agendar entrega da patinha.',
            requestType: 'agora',
            status: 'pronto_para_entrega',
            deliveryStatus: 'ready_for_scheduling',
            history: [
                { date: faker.date.recent({ days: 5 }).toISOString(), action: 'Solicitação criada', user: 'Fernanda Lima' },
                { date: faker.date.recent({ days: 2 }).toISOString(), action: 'Lembrancinha produzida', user: 'Operacional' },
                { date: faker.date.recent({ days: 1 }).toISOString(), action: 'Lembrancinha pronta. Encaminhado para entrega.', user: 'Operacional' },
            ],
            createdAt: faker.date.recent({ days: 5 }).toISOString(),
            realWeight: 35.0,
            contactedByFinance: true,
            assignedFinanceiroJunior: { id: 'func_financeiro_junior_1', name: 'Financeiro Junior 1 (Teste)' },
        },
        {
            id: uuidv4(),
            code: `COL_PRONTO_2`,
            contractNumber: `A${(61).toString().padStart(8, '0')}`,
            createdById: 'pf_123',
            modality: 'coletivo',
            tutor: { name: 'Marcos Souza', cpfOrCnpj: faker.finance.accountNumber(11), phone: '41988776655', email: 'marcos@example.com' },
            pet: { name: 'Mel', species: 'gato', breed: 'Siames', gender: 'femea', weight: '0-5kg', causeOfDeath: 'Natural' },
            removalAddress: curitibaAddresses[6],
            additionals: [],
            customAdditionals: [
                { id: uuidv4(), name: 'PINGENTE EM RESINA', value: 250 }
            ],
            paymentMethod: 'credito',
            value: 207.00 + 250.00,
            observations: 'Pingente pronto.',
            requestType: 'agora',
            status: 'pronto_para_entrega',
            deliveryStatus: 'ready_for_scheduling',
            history: [
                { date: faker.date.recent({ days: 6 }).toISOString(), action: 'Solicitação criada', user: 'Marcos Souza' },
                { date: faker.date.recent({ days: 3 }).toISOString(), action: 'Lembrancinha produzida', user: 'Operacional' },
                { date: faker.date.recent({ days: 1 }).toISOString(), action: 'Lembrancinha pronta. Encaminhado para entrega.', user: 'Operacional' },
            ],
            createdAt: faker.date.recent({ days: 6 }).toISOString(),
            realWeight: 4.0,
            contactedByFinance: true,
            assignedFinanceiroJunior: { id: 'func_financeiro_junior_1', name: 'Financeiro Junior 1 (Teste)' },
        }
    ];
    
    mockRemovals.push(...prontoParaEntregaRemovals);
    mockRemovals.push(...coletivoProntoEntrega);

    // Gerar 5 remoções individuais finalizadas para o cremador
    for (let i = 0; i < 5; i++) {
        mockRemovals.push({
            id: uuidv4(),
            code: `CREM_${i+1}`,
            contractNumber: `A${(i + 24).toString().padStart(8, '0')}`,
            createdById: 'pf_123',
            modality: 'individual_prata',
            tutor: { name: faker.person.fullName(), cpfOrCnpj: faker.finance.accountNumber(11), phone: faker.phone.number(), email: faker.internet.email() },
            pet: { name: faker.animal.dog(), species: 'cachorro', breed: 'SRD', gender: 'macho', weight: '6-10kg', causeOfDeath: 'Natural' },
            removalAddress: curitibaAddresses[(i + 9) % curitibaAddresses.length],
            additionals: [],
            paymentMethod: 'pix',
            value: 780,
            observations: 'Aguardando cremação.',
            requestType: 'agora',
            status: 'finalizada',
            history: [
                { date: faker.date.past().toISOString(), action: 'Solicitação criada', user: 'Tutor' },
                { date: faker.date.recent().toISOString(), action: 'Liberado para cremação pelo Operacional', user: 'Operacional (Teste)' },
            ],
            createdAt: faker.date.recent({ days: 4 }).toISOString(),
            realWeight: 8.5,
            contactedByFinance: true,
            cremationCompany: 'PETCÈU',
        });
    }

    const mapTestRemovals: Removal[] = [
        {
            id: uuidv4(),
            code: `MAPA_TESTE_1`,
            contractNumber: `A${(29).toString().padStart(8, '0')}`,
            createdById: 'clinic_456',
            clinicName: 'Clínica Vet Batel',
            modality: 'individual_prata',
            tutor: { name: 'Mariana Oliveira', cpfOrCnpj: faker.finance.accountNumber(11), phone: faker.phone.number(), email: faker.internet.email() },
            pet: { name: 'Bidu', species: 'cachorro', breed: 'Schnauzer', gender: 'macho', weight: '6-10kg', causeOfDeath: 'Natural' },
            removalAddress: { street: 'Rua Comendador Araújo', number: '510', neighborhood: 'Batel', city: 'Curitiba', state: 'PR', cep: '80420-000' },
            additionals: [],
            paymentMethod: 'credito',
            value: 780.00,
            observations: 'Teste de mapa - Batel.',
            requestType: 'agora',
            status: 'em_andamento',
            history: [
                { date: faker.date.recent().toISOString(), action: 'Solicitação criada', user: 'Clínica Vet Batel' },
                { date: faker.date.recent().toISOString(), action: 'Receptor Taiane encaminhou para o motorista Fernando', user: 'Taiane (Receptor)' },
            ],
            createdAt: faker.date.recent({ days: 1 }).toISOString(),
            assignedDriver: mockDrivers[0], // Fernando
            realWeight: 8.2,
            contactedByFinance: true,
        },
        {
            id: uuidv4(),
            code: `MAPA_TESTE_2`,
            contractNumber: `A${(30).toString().padStart(8, '0')}`,
            createdById: 'pf_123',
            modality: 'individual_ouro',
            tutor: { name: 'Lucas Martins', cpfOrCnpj: faker.finance.accountNumber(11), phone: faker.phone.number(), email: faker.internet.email() },
            pet: { name: 'Misty', species: 'gato', breed: 'Persa', gender: 'femea', weight: '0-5kg', causeOfDeath: 'Idade avançada' },
            removalAddress: { street: 'Avenida Cândido de Abreu', number: '817', neighborhood: 'Centro Cívico', city: 'Curitiba', state: 'PR', cep: '80530-000' },
            additionals: [],
            paymentMethod: 'pix',
            value: 500.00,
            observations: 'Teste de mapa - Centro Cívico. A caminho.',
            requestType: 'agora',
            status: 'a_caminho', // This one should be green
            history: [
                { date: faker.date.recent().toISOString(), action: 'Solicitação criada', user: 'Lucas Martins' },
                { date: faker.date.recent().toISOString(), action: 'Receptor Taiane encaminhou para o motorista Fernando', user: 'Taiane (Receptor)' },
                { date: faker.date.recent().toISOString(), action: 'Motorista Fernando iniciou o deslocamento', user: 'Fernando (Motorista)' },
            ],
            createdAt: faker.date.recent({ days: 1 }).toISOString(),
            assignedDriver: mockDrivers[0], // Fernando
            realWeight: 4.5,
            contactedByFinance: true,
        },
        {
            id: uuidv4(),
            code: `MAPA_TESTE_3`,
            contractNumber: `A${(31).toString().padStart(8, '0')}`,
            createdById: 'clinic_456',
            clinicName: 'Clínica Água Verde',
            modality: 'coletivo',
            tutor: { name: 'Juliana Souza', cpfOrCnpj: faker.finance.accountNumber(11), phone: faker.phone.number(), email: faker.internet.email() },
            pet: { name: 'Pipoca', species: 'cachorro', breed: 'SRD', gender: 'femea', weight: '11-20kg', causeOfDeath: 'Atropelamento' },
            removalAddress: { street: 'Avenida República Argentina', number: '1505', neighborhood: 'Água Verde', city: 'Curitiba', state: 'PR', cep: '80620-010' },
            additionals: [],
            paymentMethod: 'faturado',
            value: 255.00,
            observations: 'Teste de mapa - Água Verde.',
            requestType: 'agora',
            status: 'em_andamento',
            history: [
                { date: faker.date.recent().toISOString(), action: 'Solicitação criada', user: 'Clínica Água Verde' },
                { date: faker.date.recent().toISOString(), action: 'Receptor Taiane encaminhou para o motorista Mariana Lima', user: 'Taiane (Receptor)' },
            ],
            createdAt: faker.date.recent({ days: 1 }).toISOString(),
            assignedDriver: mockDrivers[1], // Mariana Lima
            realWeight: 15.0,
            contactedByFinance: false,
        },
    ];
    mockRemovals.push(...mapTestRemovals);

    // Gerar 3 remoções para "Coletivo Liberado para Venda"
    for (let i = 0; i < 3; i++) {
        const liberadoVenda: Removal = {
            id: uuidv4(),
            code: `VENDA_COLETIVO_${i+1}`,
            contractNumber: `A${(i + 32).toString().padStart(8, '0')}`,
            createdById: 'clinic_456',
            clinicName: 'Clínica Amigo Fiel',
            modality: 'coletivo',
            tutor: {
                name: faker.person.fullName(),
                cpfOrCnpj: faker.finance.accountNumber(11),
                phone: faker.phone.number(),
                email: faker.internet.email(),
            },
            pet: {
                name: faker.animal.cat(),
                species: 'gato',
                breed: 'SRD',
                gender: faker.helpers.arrayElement(['macho', 'femea']),
                weight: '0-5kg',
                causeOfDeath: 'Natural',
            },
            removalAddress: curitibaAddresses[i % curitibaAddresses.length],
            additionals: [],
            paymentMethod: 'pix',
            value: 207.00,
            observations: `Remoção coletiva liberada para venda de produtos adicionais ${i+1}.`,
            requestType: 'agora',
            status: 'aguardando_venda_receptor',
            history: [
                { date: faker.date.past({ days: 5 }).toISOString(), action: 'Solicitação criada', user: 'Clínica Amigo Fiel' },
                { date: faker.date.past({ days: 4 }).toISOString(), action: 'Receptor encaminhou para o motorista', user: 'Receptor (Teste)' },
                { date: faker.date.past({ days: 3 }).toISOString(), action: 'Motorista finalizou a remoção', user: 'Motorista (Teste)' },
                { date: faker.date.past({ days: 2 }).toISOString(), action: 'Encaminhado para o Financeiro Master', user: 'Operacional (Teste)' },
                { date: faker.date.recent({ days: 1 }).toISOString(), action: 'Encaminhado para Venda (Receptor) pelo Fin. Master', user: 'Financeiro Master (Teste)' },
            ],
            createdAt: faker.date.past({ days: 5 }).toISOString(),
            assignedDriver: mockDrivers[i % mockDrivers.length],
            realWeight: faker.number.int({ min: 3, max: 5 }),
            contactedByFinance: false,
            assignedFinanceiroMaster: { id: 'func_financeiro_master_1', name: 'Financeiro Master 1 (Teste)' },
        };
        mockRemovals.push(liberadoVenda);
    }

    const coletivoLembrancinhaRemovals: Removal[] = [
        {
            id: uuidv4(),
            code: `LEMBRANCA_01`,
            contractNumber: `A${(35).toString().padStart(8, '0')}`,
            createdById: 'clinic_456',
            clinicName: 'Clínica Vet Top (Teste)',
            modality: 'coletivo',
            tutor: {
                name: 'Carla Dias',
                cpfOrCnpj: faker.finance.accountNumber(11),
                phone: faker.phone.number(),
                email: faker.internet.email(),
            },
            pet: {
                name: 'Bolinha',
                species: 'cachorro',
                breed: 'Shih Tzu',
                gender: 'macho',
                weight: '6-10kg',
                causeOfDeath: 'Natural',
            },
            removalAddress: curitibaAddresses[0],
            additionals: [],
            customAdditionals: [
                { id: uuidv4(), name: 'PATINHA', value: 150 }
            ],
            paymentMethod: 'pix',
            value: 230.00 + 150.00, // Coletivo 6-10kg + Patinha
            observations: 'Tutor solicitou a patinha em resina.',
            requestType: 'agora',
            status: 'aguardando_producao_adicionais',
            history: [
                { date: faker.date.past({ days: 2 }).toISOString(), action: 'Solicitação criada', user: 'Clínica Vet Top' },
                { date: faker.date.recent({ days: 1 }).toISOString(), action: 'Receptor finalizou vendas e encaminhou para Operacional', user: 'Receptor (Teste)' },
            ],
            createdAt: faker.date.past({ days: 2 }).toISOString(),
            realWeight: 7.5,
        },
        {
            id: uuidv4(),
            code: `LEMBRANCA_02`,
            contractNumber: `A${(36).toString().padStart(8, '0')}`,
            createdById: 'pf_123',
            modality: 'coletivo',
            tutor: {
                name: 'Roberto Alves',
                cpfOrCnpj: faker.finance.accountNumber(11),
                phone: faker.phone.number(),
                email: faker.internet.email(),
            },
            pet: {
                name: 'Nino',
                species: 'gato',
                breed: 'SRD',
                gender: 'macho',
                weight: '0-5kg',
                causeOfDeath: 'Idade avançada',
            },
            removalAddress: curitibaAddresses[1],
            additionals: [],
            customAdditionals: [
                { id: uuidv4(), name: 'PATINHA', value: 150 }
            ],
            paymentMethod: 'credito',
            value: 207.00 + 150.00, // Coletivo 0-5kg + Patinha
            observations: 'Patinha em resina vendida pelo receptor.',
            requestType: 'agora',
            status: 'aguardando_producao_adicionais',
            history: [
                { date: faker.date.past({ days: 3 }).toISOString(), action: 'Solicitação criada', user: 'Roberto Alves' },
                { date: faker.date.recent({ days: 1 }).toISOString(), action: 'Receptor finalizou vendas e encaminhou para Operacional', user: 'Receptor (Teste)' },
            ],
            createdAt: faker.date.past({ days: 3 }).toISOString(),
            realWeight: 4.8,
        },
    ];

    mockRemovals.push(...coletivoLembrancinhaRemovals);

    const representativeRemovals: Removal[] = [
        {
            id: uuidv4(),
            code: `REP_01`,
            contractNumber: `A${(37).toString().padStart(8, '0')}`,
            createdById: 'clinic_4',
            clinicName: 'Hospital Veterinário Curitiba',
            modality: 'coletivo',
            tutor: { name: faker.person.fullName(), cpfOrCnpj: faker.finance.accountNumber(11), phone: faker.phone.number(), email: faker.internet.email() },
            pet: { name: faker.animal.dog(), species: 'cachorro', breed: 'SRD', gender: 'macho', weight: '11-20kg', causeOfDeath: 'Natural' },
            removalAddress: curitibaAddresses[8],
            additionals: [],
            paymentMethod: 'faturado',
            value: 280.50,
            observations: 'Contrato gerado pelo representante.',
            requestType: 'agora',
            status: 'solicitada',
            history: [{ date: faker.date.recent().toISOString(), action: 'Solicitação criada pelo Representante 1 (Teste)', user: 'Representante 1 (Teste)' }],
            createdAt: faker.date.recent().toISOString(),
            representativeId: 'func_representante_1',
            representativeName: 'Representante 1 (Teste)',
        },
        {
            id: uuidv4(),
            code: `REP_02`,
            contractNumber: `A${(38).toString().padStart(8, '0')}`,
            createdById: 'clinic_4',
            clinicName: 'Hospital Veterinário Curitiba',
            modality: 'individual_prata',
            tutor: { name: faker.person.fullName(), cpfOrCnpj: faker.finance.accountNumber(11), phone: faker.phone.number(), email: faker.internet.email() },
            pet: { name: faker.animal.cat(), species: 'gato', breed: 'SRD', gender: 'femea', weight: '0-5kg', causeOfDeath: 'Natural' },
            removalAddress: curitibaAddresses[9],
            additionals: [],
            paymentMethod: 'faturado',
            value: 528.00,
            observations: 'Contrato gerado pelo representante.',
            requestType: 'agora',
            status: 'em_andamento',
            history: [
                { date: faker.date.recent().toISOString(), action: 'Solicitação criada pelo Representante 1 (Teste)', user: 'Representante 1 (Teste)' },
                { date: faker.date.recent().toISOString(), action: 'Receptor encaminhou para o motorista', user: 'Receptor (Teste)' },
            ],
            createdAt: faker.date.recent().toISOString(),
            representativeId: 'func_representante_1',
            representativeName: 'Representante 1 (Teste)',
            assignedDriver: mockDrivers[0],
        },
    ];

    mockRemovals.push(...representativeRemovals);

    // Gerar outras remoções
    for (let i = 0; i < 50; i++) {
      const ownerId = owners[i % owners.length];
      const status = statuses[i % statuses.length];
      const modality = faker.helpers.arrayElement(['coletivo', 'individual_prata', 'individual_ouro']);
      const paymentMethod = status.includes('faturado') || status === 'aguardando_boleto' ? 'faturado' : faker.helpers.arrayElement(['credito', 'pix', 'dinheiro', 'link_pagamento']);
      
      const history = [{ date: faker.date.past().toISOString(), action: `Solicitação criada por ${ownerId === 'clinic_456' ? 'Clínica Vet Top' : 'João da Silva'}`, user: ownerId === 'clinic_456' ? 'Clínica Vet Top' : 'João da Silva' }];
      let assignedDriver;
      let cremationCompany;

      if (['em_andamento', 'a_caminho', 'removido', 'concluida', 'finalizada', 'aguardando_baixa_master'].includes(status)) {
        assignedDriver = drivers[i % drivers.length];
        history.push({
            date: faker.date.recent().toISOString(),
            action: `Receptor Taiane encaminhou para o motorista ${assignedDriver.name}`,
            user: 'Taiane (Receptor)'
        });
      }
      if (['a_caminho', 'removido', 'concluida', 'finalizada', 'aguardando_baixa_master'].includes(status) && assignedDriver) {
        history.push({
            date: faker.date.recent().toISOString(),
            action: `Motorista ${assignedDriver.name} iniciou o deslocamento`,
            user: `${assignedDriver.name} (Motorista)`
        });
      }
      if (['removido', 'concluida', 'finalizada', 'aguardando_baixa_master'].includes(status) && assignedDriver) {
        history.push({
            date: faker.date.recent().toISOString(),
            action: `Motorista ${assignedDriver.name} removeu o pet no endereço`,
            user: `${assignedDriver.name} (Motorista)`
        });
      }
      if (['concluida', 'finalizada', 'aguardando_baixa_master'].includes(status) && assignedDriver) {
        history.push({
            date: faker.date.recent().toISOString(),
            action: `Motorista ${assignedDriver.name} pesou o pet e finalizou a remoção`,
            user: `${assignedDriver.name} (Motorista)`
        });
      }
      if (status === 'aguardando_baixa_master' && assignedDriver) {
        cremationCompany = faker.helpers.arrayElement(['PETCÈU', 'SQP']);
        history.push({
            date: faker.date.recent().toISOString(),
            action: `Financeiro Junior (Teste) finalizou e enviou para o Financeiro Master (${cremationCompany})`,
            user: `Financeiro Junior (Teste)`
        });
      }

      const removal: Removal = {
        id: uuidv4(),
        code: `MOCK${i.toString().padStart(4, '0')}`,
        contractNumber: `A${(i + 39).toString().padStart(8, '0')}`,
        createdById: ownerId,
        clinicName: ownerId === 'clinic_456' ? 'Clínica Vet Top (Teste)' : undefined,
        modality: modality,
        tutor: {
          name: faker.person.fullName(),
          cpfOrCnpj: faker.finance.accountNumber(11),
          phone: faker.phone.number(),
          email: faker.internet.email(),
        },
        pet: {
          name: faker.animal.dog(),
          species: faker.helpers.arrayElement(['cachorro', 'gato']),
          breed: faker.animal.dog(),
          gender: faker.helpers.arrayElement(['macho', 'femea']),
          weight: faker.helpers.arrayElement(['0-5kg', '6-10kg', '11-20kg']),
          causeOfDeath: 'Causas naturais',
        },
        removalAddress: curitibaAddresses[i % curitibaAddresses.length],
        additionals: [],
        paymentMethod: paymentMethod,
        value: faker.number.int({ min: 150, max: 800 }),
        observations: faker.lorem.sentence(),
        requestType: status === 'agendada' ? 'agendar' : 'agora',
        status: status,
        history: history,
        createdAt: faker.date.past().toISOString(),
        paymentProof: (paymentMethod === 'pix' || paymentMethod === 'link_pagamento') ? 'comprovante_mock.pdf' : undefined,
        cancellationReason: status === 'cancelada' ? 'Solicitado pelo tutor.' : undefined,
        assignedDriver: assignedDriver,
        realWeight: ['concluida', 'finalizada', 'aguardando_baixa_master'].includes(status) ? faker.number.int({ min: 5, max: 20}) : undefined,
        contactedByFinance: faker.datatype.boolean({ probability: 0.1 }),
        cremationCompany: cremationCompany,
      };

      if (status === 'agendada') {
        const futureDate = faker.date.soon({ days: 1 });
        removal.scheduledDate = format(futureDate, 'yyyy-MM-dd');
        removal.scheduledTime = format(futureDate, 'HH:mm');
        removal.schedulingReason = 'Agendado pelo tutor para melhor horário.';
      }

      mockRemovals.push(removal);
    }

    // Gerar remoções finalizadas faturadas para teste do Financeiro Master (Solicitado pelo usuário)
    const finalizedFaturadoRemovals: Removal[] = [
        {
            id: uuidv4(),
            code: `FIN_FAT_01`,
            contractNumber: `A${(50).toString().padStart(8, '0')}`,
            createdById: 'clinic_1',
            clinicName: 'Clínica Vet Top (Teste)',
            clinicCnpj: '11.222.333/0001-44',
            modality: 'coletivo',
            tutor: { name: 'Roberto Carlos', cpfOrCnpj: faker.finance.accountNumber(11), phone: faker.phone.number(), email: faker.internet.email() },
            pet: { name: 'Pelé', species: 'gato', breed: 'Siames', gender: 'macho', weight: '0-5kg', causeOfDeath: 'Natural' },
            removalAddress: curitibaAddresses[0],
            additionals: [],
            paymentMethod: 'faturado',
            value: 227.70,
            observations: 'Finalizada e faturada.',
            requestType: 'agora',
            status: 'finalizada',
            history: [
                { date: faker.date.past().toISOString(), action: 'Solicitação criada', user: 'Clínica Vet Top' },
                { date: faker.date.recent().toISOString(), action: 'Finalizado pelo Financeiro Master', user: 'Financeiro Master' }
            ],
            createdAt: faker.date.recent({ days: 30 }).toISOString(),
            assignedFinanceiroMaster: { id: 'func_financeiro_master_1', name: 'Financeiro Master 1 (Teste)' },
            realWeight: 4.0,
            cremationCompany: 'PETCÈU',
            cremationDate: faker.date.recent({ days: 5 }).toISOString().split('T')[0],
        },
        {
            id: uuidv4(),
            code: `FIN_FAT_02`,
            contractNumber: `A${(51).toString().padStart(8, '0')}`,
            createdById: 'clinic_2',
            clinicName: 'Clínica Amigo Fiel',
            clinicCnpj: '22.333.444/0001-55',
            modality: 'individual_prata',
            tutor: { name: 'Erasmo Carlos', cpfOrCnpj: faker.finance.accountNumber(11), phone: faker.phone.number(), email: faker.internet.email() },
            pet: { name: 'Wanderléa', species: 'cachorro', breed: 'Poodle', gender: 'femea', weight: '6-10kg', causeOfDeath: 'Idade' },
            removalAddress: curitibaAddresses[1],
            additionals: [],
            paymentMethod: 'faturado',
            value: 858.00,
            observations: 'Finalizada e faturada.',
            requestType: 'agora',
            status: 'finalizada',
            history: [
                { date: faker.date.past().toISOString(), action: 'Solicitação criada', user: 'Clínica Amigo Fiel' },
                { date: faker.date.recent().toISOString(), action: 'Finalizado pelo Financeiro Master', user: 'Financeiro Master' }
            ],
            createdAt: faker.date.recent({ days: 25 }).toISOString(),
            assignedFinanceiroMaster: { id: 'func_financeiro_master_1', name: 'Financeiro Master 1 (Teste)' },
            realWeight: 8.0,
            cremationCompany: 'SQP',
            cremationDate: faker.date.recent({ days: 10 }).toISOString().split('T')[0],
        }
    ];
    mockRemovals.push(...finalizedFaturadoRemovals);

    return mockRemovals;
};
