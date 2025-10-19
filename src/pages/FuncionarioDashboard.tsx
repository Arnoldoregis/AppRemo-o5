import React from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Layout from '../components/Layout';
import AdminHome from './AdminHome';
import ReceptorHome from './ReceptorHome';
import MotoristaHome from './MotoristaHome';
import FinanceiroJuniorHome from './FinanceiroJuniorHome';
import FinanceiroMasterHome from './FinanceiroMasterHome';
import GerenciaHome from './GerenciaHome';
import OperacionalHome from './OperacionalHome';
import CremadorDashboardPage from './CremadorDashboardPage';
import AgendaDespedida from './AgendaDespedida';
import RepresentanteHome from './RepresentanteHome';

const FuncionarioDashboard: React.FC = () => {
  const { role } = useParams<{ role: string }>();
  const { user } = useAuth();

  // Define quais perfis têm permissão de ESCRITA em cada painel
  const writePermissions: Record<string, string[]> = {
    receptor: ['receptor', 'financeiro_junior', 'financeiro_master'],
    motorista: ['motorista'],
    operacional: ['operacional'],
    financeiro_junior: ['financeiro_junior', 'financeiro_master'],
    financeiro_master: ['financeiro_master', 'financeiro_junior'],
    representante: ['representante'],
    administrador: ['administrador'],
    gerencia: ['gerencia'],
    cremador: ['cremador', 'operacional'],
    agenda_despedida: ['financeiro_junior', 'operacional', 'financeiro_master'],
  };

  const loggedInRole = user?.role;
  const viewedRole = role;

  // O usuário pode escrever se:
  // 1. Ele está em seu próprio painel.
  // 2. O painel que ele está visualizando permite que o seu perfil escreva nele.
  const hasWriteAccess = 
    loggedInRole && 
    viewedRole && 
    (loggedInRole === viewedRole || (writePermissions[viewedRole]?.includes(loggedInRole) ?? false));

  const isReadOnly = !hasWriteAccess;

  switch (role) {
    case 'administrador':
      return <AdminHome />;
    case 'receptor':
      return <ReceptorHome isReadOnly={isReadOnly} viewedRole={viewedRole} />;
    case 'motorista':
      return <MotoristaHome isReadOnly={isReadOnly} viewedRole={viewedRole} />;
    case 'financeiro_junior':
      return <FinanceiroJuniorHome isReadOnly={isReadOnly} viewedRole={viewedRole} />;
    case 'financeiro_master':
      return <FinanceiroMasterHome isReadOnly={isReadOnly} viewedRole={viewedRole} />;
    case 'gerencia':
      return <GerenciaHome />;
    case 'operacional':
      return <OperacionalHome isReadOnly={isReadOnly} viewedRole={viewedRole} />;
    case 'cremador':
        return <CremadorDashboardPage isReadOnly={isReadOnly} viewedRole={viewedRole} />;
    case 'agenda-despedida':
        return <AgendaDespedida isReadOnly={isReadOnly} viewedRole={viewedRole} />;
    case 'representante':
        return <RepresentanteHome isReadOnly={isReadOnly} viewedRole={viewedRole} />;
    default:
      return (
        <Layout title="Erro">
          <div className="text-center text-red-500">
            <h1 className="text-2xl">Função de usuário desconhecida.</h1>
          </div>
        </Layout>
      );
  }
};

export default FuncionarioDashboard;
