import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Truck, Phone, HardHat, Cog, DollarSign, Briefcase, User as UserIcon, Stethoscope, Handshake } from 'lucide-react';
import RoleLoginModal, { Role } from '../components/modals/RoleLoginModal';
import { User } from '../types';
import { APP_IMAGES } from '../config/assets';

const HomePage: React.FC = () => {
  const { login, logout } = useAuth();
  const navigate = useNavigate();
  const [modalState, setModalState] = useState<{ isOpen: boolean; role: Role | null }>({ isOpen: false, role: null });

  const roles: Role[] = [
    { name: 'Solicitar Remoção Pessoa Fisica', icon: UserIcon, userType: 'pessoa_fisica', color: 'indigo' },
    { name: 'Solicitar Remoção Clinica', icon: Stethoscope, userType: 'clinica', color: 'pink' },
    { name: 'Motorista', icon: Truck, userType: 'funcionarios', color: 'blue' },
    { name: 'Receptor', icon: Phone, userType: 'funcionarios', color: 'green' },
    { name: 'Operacional', icon: HardHat, userType: 'funcionarios', color: 'orange' },
    { name: 'Financeiro', icon: DollarSign, userType: 'funcionarios', color: 'teal' },
    { name: 'Representante', icon: Handshake, userType: 'funcionarios', color: 'red' },
    { name: 'Gerência', icon: Briefcase, userType: 'funcionarios', color: 'purple' },
    { name: 'Administrador', icon: Cog, userType: 'funcionarios', color: 'slate' },
  ];

  const colorClasses: { [key: string]: string } = {
    indigo: 'bg-indigo-100 text-indigo-700 hover:bg-indigo-200 border-indigo-200',
    pink: 'bg-pink-100 text-pink-700 hover:bg-pink-200 border-pink-200',
    blue: 'bg-blue-100 text-blue-700 hover:bg-blue-200 border-blue-200',
    green: 'bg-green-100 text-green-700 hover:bg-green-200 border-green-200',
    orange: 'bg-orange-100 text-orange-700 hover:bg-orange-200 border-orange-200',
    teal: 'bg-teal-100 text-teal-700 hover:bg-teal-200 border-teal-200',
    purple: 'bg-purple-100 text-purple-700 hover:bg-purple-200 border-purple-200',
    slate: 'bg-slate-100 text-slate-700 hover:bg-slate-200 border-slate-200',
    red: 'bg-red-100 text-red-700 hover:bg-red-200 border-red-200',
  };

  const iconColorClasses: { [key: string]: string } = {
    indigo: 'text-indigo-600',
    pink: 'text-pink-600',
    blue: 'text-blue-600',
    green: 'text-green-600',
    orange: 'text-orange-600',
    teal: 'text-teal-600',
    purple: 'text-purple-600',
    slate: 'text-slate-600',
    red: 'text-red-600',
  };

  const handleRoleClick = (role: Role) => {
    if (role.userType === 'pessoa_fisica') {
      navigate('/solicitar-remocao');
    } else if (role.userType === 'clinica') {
      navigate('/solicitar-remocao-clinica');
    } else {
      setModalState({ isOpen: true, role });
    }
  };

  const handleCloseModal = () => {
    setModalState({ isOpen: false, role: null });
  };

  const handleLogin = async (email: string, password: string, userType: Role['userType']): Promise<void> => {
    if (!modalState.role) {
      throw new Error("Função de acesso não selecionada.");
    }
  
    const loggedInUser = await login(email, password, userType);
  
    if (loggedInUser) {
      const clickedRole = modalState.role;
  
      const checkRoleAccess = (clickedRole: Role, loggedInUser: User): boolean => {
        const { userType: clickedUserType, name: clickedName } = clickedRole;
        const { userType: loggedInUserType, role: loggedInRoleName } = loggedInUser;
  
        if (clickedUserType !== 'funcionarios') {
          return clickedUserType === loggedInUserType;
        }
  
        if (loggedInUserType !== 'funcionario') {
          return false;
        }
  
        const roleMapping: { [key: string]: string[] } = {
          'Motorista': ['motorista'],
          'Receptor': ['receptor'],
          'Operacional': ['operacional'],
          'Financeiro': ['financeiro_junior', 'financeiro_master'],
          'Representante': ['representante'],
          'Gerência': ['gerencia'],
          'Administrador': ['administrador'],
        };
  
        const allowedRoles = roleMapping[clickedName];
        return allowedRoles ? allowedRoles.includes(loggedInRoleName || '') : false;
      };
  
      const hasAccess = checkRoleAccess(clickedRole, loggedInUser);
  
      if (!hasAccess) {
        logout(); // Desloga o usuário imediatamente
        throw new Error('Acesso negado. Você não tem permissão para usar este painel.');
      }
  
      // Se o acesso for permitido, navega para o painel correto
      if (loggedInUser.userType === 'funcionario' && loggedInUser.role) {
        navigate(`/funcionario/${loggedInUser.role}`);
      } else if (loggedInUser.userType === 'pessoa_fisica') {
        navigate('/pessoa-fisica');
      } else if (loggedInUser.userType === 'clinica') {
        navigate('/clinica');
      }
    } else {
      throw new Error('Email ou senha inválidos.');
    }
  };
  
  const renderRoleButton = (role: Role) => (
    <button
      key={role.name}
      onClick={() => handleRoleClick(role)}
      className={`group relative flex w-full aspect-square flex-col items-center justify-center rounded-xl border p-4 transition-all duration-300 md:h-36 md:w-36 md:aspect-auto shadow-sm hover:shadow-md hover:-translate-y-1 ${colorClasses[role.color]} bg-opacity-90 backdrop-blur-sm`}
    >
      <role.icon className={`h-8 w-8 transition-colors ${iconColorClasses[role.color]}`} />
      <span className="mt-3 text-center text-xs font-semibold transition-colors">
        {role.name}
      </span>
    </button>
  );

  return (
    <div className="relative min-h-screen w-full overflow-hidden font-sans text-gray-800 bg-gray-50">
      {/* Camada de Fundo Fixa */}
      <div 
        className="fixed inset-0 z-0"
        style={{ 
          backgroundImage: `url(${APP_IMAGES.homeBackground})`,
          backgroundSize: '70%',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
        }}
      />

      {/* Camada de Overlay (Branco Transparente) */}
      <div className="fixed inset-0 z-0 bg-white/10 backdrop-blur-sm" />

      {/* Conteúdo Principal (Scrollável se necessário) */}
      <div className="relative z-10 min-h-screen flex flex-col items-center justify-center p-4 md:p-8">
        <main className="mx-auto w-full max-w-6xl text-center">
          {/* Container do Conteúdo com fundo bem transparente (20%) e desfoque suave */}
          <div className="bg-white/20 backdrop-blur-sm rounded-3xl p-6 md:p-10 shadow-xl border border-white/20">
              <h1 className="text-4xl font-extrabold tracking-tight text-gray-900 sm:text-5xl drop-shadow-sm">
              REMOÇÃO PET
              </h1>
              <p className="mt-4 text-base leading-7 text-gray-800 font-bold">
              SISTEMA DE GERENCIAMENTO DE REMOÇÃO
              </p>

              <div className="mt-12">
                  {/* Layout Mobile/Tablet */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:hidden gap-4">
                      {roles.map(renderRoleButton)}
                  </div>

                  {/* Layout Desktop */}
                  <div className="hidden md:flex flex-col items-center space-y-5">
                      <div className="grid grid-cols-5 gap-5">
                          {roles.slice(0, 5).map(renderRoleButton)}
                      </div>
                      <div className="grid grid-cols-4 gap-5">
                          {roles.slice(5).map(renderRoleButton)}
                      </div>
                  </div>
              </div>
          </div>
        </main>
      </div>

      <RoleLoginModal
        isOpen={modalState.isOpen}
        onClose={handleCloseModal}
        role={modalState.role}
        onLogin={handleLogin}
      />
    </div>
  );
};

export default HomePage;
