import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { LogOut, Home, Menu, ArrowLeft } from 'lucide-react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import NotificationBell from './NotificationBell';
import ChatWidget from './ChatWidget';
import ChatModal from './modals/ChatModal';
import ConversationListModal from './modals/ConversationListModal';
import Sidebar from './shared/Sidebar';

interface LayoutProps {
  children: React.ReactNode;
  title: string;
}

const Layout: React.FC<LayoutProps> = ({ children, title }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { role: currentViewRole } = useParams<{ role: string }>();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const handleHome = () => {
    if (user?.userType === 'pessoa_fisica') {
      navigate('/pessoa-fisica');
    } else if (user?.userType === 'clinica') {
      navigate('/clinica');
    } else if (user?.userType === 'funcionario') {
      navigate(`/funcionario/${user.role}`);
    } else {
      navigate('/');
    }
  };

  const handleGoBackToMyDashboard = () => {
    if (user?.role) {
      navigate(`/funcionario/${user.role}`);
    }
  };

  // Verifica se é uma das páginas públicas de solicitação
  const isPublicRequestPage = ['/solicitar-remocao', '/solicitar-remocao-clinica'].includes(location.pathname);

  // Mostra o chat se:
  // 1. Usuário logado é PF ou Clínica
  // 2. Usuário logado é Receptor
  // 3. Estamos em uma página pública de solicitação (para visitantes)
  const showChat = user?.userType === 'pessoa_fisica' || user?.userType === 'clinica' || user?.role === 'receptor' || isPublicRequestPage;

  const isViewingAnotherDashboard = user?.role && currentViewRole && user.role !== currentViewRole;
  
  const canShowSidebar = ['receptor', 'motorista', 'operacional', 'financeiro_junior', 'financeiro_master', 'representante'].includes(user?.role || '');

  return (
    <div className="min-h-screen bg-gray-50">
      {canShowSidebar && (
        <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
      )}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-4 min-w-0">
              {isViewingAnotherDashboard ? (
                <button
                  onClick={handleGoBackToMyDashboard}
                  className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors text-sm font-medium"
                  title="Voltar ao meu painel"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Voltar
                </button>
              ) : (
                canShowSidebar && (
                  <button
                      onClick={() => setIsSidebarOpen(true)}
                      className="p-2 text-gray-600 hover:text-gray-900 transition-colors"
                      title="Menu"
                  >
                      <Menu className="h-6 w-6" />
                  </button>
                )
              )}
              <h1 className="text-base md:text-xl font-semibold text-gray-900">{title}</h1>
            </div>
            <div className="flex items-center space-x-4">
              {user ? (
                <>
                  <NotificationBell />
                  <span className="text-sm text-gray-600 hidden sm:inline">
                    Olá, {user.name}
                  </span>
                  <button
                    onClick={handleHome}
                    className="p-2 text-gray-600 hover:text-gray-900 transition-colors"
                    title="Início"
                  >
                    <Home className="h-5 w-5" />
                  </button>
                  <button
                    onClick={handleLogout}
                    className="p-2 text-gray-600 hover:text-gray-900 transition-colors"
                    title="Sair"
                  >
                    <LogOut className="h-5 w-5" />
                  </button>
                </>
              ) : (
                // Botão Home para visitantes
                <button
                    onClick={() => navigate('/')}
                    className="p-2 text-gray-600 hover:text-gray-900 transition-colors"
                    title="Página Inicial"
                >
                    <Home className="h-5 w-5" />
                </button>
              )}
            </div>
          </div>
        </div>
      </header>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
      {showChat && (
        <>
          <ChatWidget />
          <ConversationListModal />
          <ChatModal />
        </>
      )}
    </div>
  );
};

export default Layout;
