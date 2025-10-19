import React, { useState } from 'react';
import { X } from 'lucide-react';
import LoginForm from '../LoginForm';
import ForgotPasswordModal from '../ForgotPasswordModal';

export interface Role {
  name: string;
  icon: React.ElementType;
  userType: 'funcionarios' | 'pessoa_fisica' | 'clinica';
  color: string;
}

interface RoleLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  role: Role | null;
  onLogin: (email: string, password: string, userType: Role['userType']) => Promise<boolean>;
}

const RoleLoginModal: React.FC<RoleLoginModalProps> = ({ isOpen, onClose, role, onLogin }) => {
  const [showForgotPassword, setShowForgotPassword] = useState(false);

  if (!isOpen || !role) return null;

  const RoleIcon = role.icon;

  const handleLoginSubmit = (email: string, password: string) => {
    return onLogin(email, password, role.userType);
  };

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4 transition-opacity duration-300">
        <div className="bg-white rounded-2xl shadow-xl w-full max-w-md transform transition-all duration-300 scale-100">
          <div className="p-8 relative">
            <button
              onClick={onClose}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
            >
              <X className="h-6 w-6" />
            </button>
            <div className="flex flex-col items-center text-center mb-6">
              <div className={`bg-${role.color}-100 p-4 rounded-full mb-4`}>
                <RoleIcon className={`h-10 w-10 text-${role.color}-600`} />
              </div>
              <h2 className="text-2xl font-bold text-gray-900">
                Acesso {role.name}
              </h2>
            </div>
            <LoginForm
              onLogin={handleLoginSubmit}
              onForgotPassword={() => setShowForgotPassword(true)}
            />
          </div>
        </div>
      </div>
      <ForgotPasswordModal
        isOpen={showForgotPassword}
        onClose={() => setShowForgotPassword(false)}
      />
    </>
  );
};

export default RoleLoginModal;
