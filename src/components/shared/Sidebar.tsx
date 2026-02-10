import React from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, DollarSign, Crown, HardHat, Phone, Truck, Flame, CalendarDays, Handshake } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const navItemsConfig: Record<string, { name: string; path: string; icon: React.ElementType }[]> = {
  motorista: [
    { name: 'Receptor (Visualizar)', path: '/funcionario/receptor', icon: Phone },
    { name: 'Operacional (Visualizar)', path: '/funcionario/operacional', icon: HardHat },
    { name: 'Financeiro Junior (Visualizar)', path: '/funcionario/financeiro_junior', icon: DollarSign },
    { name: 'Financeiro Master (Visualizar)', path: '/funcionario/financeiro_master', icon: Crown },
    { name: 'Painel do Cremador (Visualizar)', path: '/painel-cremador', icon: Flame },
    { name: 'Agenda de Despedida (Visualizar)', path: '/agenda-despedida', icon: CalendarDays },
  ],
  receptor: [
    { name: 'Motorista (Visualizar)', path: '/funcionario/motorista', icon: Truck },
    { name: 'Operacional (Visualizar)', path: '/funcionario/operacional', icon: HardHat },
    { name: 'Financeiro Junior (Visualizar)', path: '/funcionario/financeiro_junior', icon: DollarSign },
    { name: 'Financeiro Master (Visualizar)', path: '/funcionario/financeiro_master', icon: Crown },
    { name: 'Painel do Cremador (Visualizar)', path: '/painel-cremador', icon: Flame },
    { name: 'Agenda de Despedida', path: '/agenda-despedida', icon: CalendarDays },
  ],
  operacional: [
    { name: 'Motorista (Visualizar)', path: '/funcionario/motorista', icon: Truck },
    { name: 'Receptor (Visualizar)', path: '/funcionario/receptor', icon: Phone },
    { name: 'Financeiro Junior (Visualizar)', path: '/funcionario/financeiro_junior', icon: DollarSign },
    { name: 'Financeiro Master (Visualizar)', path: '/funcionario/financeiro_master', icon: Crown },
  ],
  financeiro_junior: [
    { name: 'Receptor', path: '/funcionario/receptor', icon: Phone },
    { name: 'Financeiro Master', path: '/funcionario/financeiro_master', icon: Crown },
    { name: 'Motorista (Visualizar)', path: '/funcionario/motorista', icon: Truck },
    { name: 'Operacional (Visualizar)', path: '/funcionario/operacional', icon: HardHat },
    { name: 'Painel do Cremador (Visualizar)', path: '/painel-cremador', icon: Flame },
    { name: 'Agenda de Despedida (Visualizar)', path: '/agenda-despedida', icon: CalendarDays },
  ],
  financeiro_master: [
    { name: 'Receptor', path: '/funcionario/receptor', icon: Phone },
    { name: 'Financeiro Junior', path: '/funcionario/financeiro_junior', icon: DollarSign },
    { name: 'Motorista (Visualizar)', path: '/funcionario/motorista', icon: Truck },
    { name: 'Operacional (Visualizar)', path: '/funcionario/operacional', icon: HardHat },
    { name: 'Painel do Cremador (Visualizar)', path: '/painel-cremador', icon: Flame },
    { name: 'Agenda de Despedida (Visualizar)', path: '/agenda-despedida', icon: CalendarDays },
  ],
  representante: [
    { name: 'Receptor (Visualizar)', path: '/funcionario/receptor', icon: Phone },
    { name: 'Operacional (Visualizar)', path: '/funcionario/operacional', icon: HardHat },
    { name: 'Financeiro Junior (Visualizar)', path: '/funcionario/financeiro_junior', icon: DollarSign },
    { name: 'Financeiro Master (Visualizar)', path: '/funcionario/financeiro_master', icon: Crown },
  ]
};

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const sidebarVariants = {
    hidden: { x: '-100%' },
    visible: { x: 0 },
  };

  const navItems = user?.role ? navItemsConfig[user.role] || [] : [];

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 bg-black bg-opacity-50 z-[90]"
            onClick={onClose}
          />
          <motion.div
            variants={sidebarVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="fixed top-0 left-0 h-full w-72 bg-white shadow-xl z-[100]"
          >
            <div className="p-4 flex justify-between items-center border-b">
              <h2 className="text-lg font-bold text-gray-800">Navegação Rápida</h2>
              <button onClick={onClose} className="text-gray-500 hover:text-gray-800">
                <X size={24} />
              </button>
            </div>
            <nav className="p-4">
              <ul>
                {navItems.map((item) => (
                  <li key={item.name}>
                    <Link
                      to={item.path}
                      onClick={onClose}
                      className="flex items-center p-3 my-2 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors"
                    >
                      <item.icon className="h-5 w-5 mr-3" />
                      <span className="font-medium">{item.name}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default Sidebar;
