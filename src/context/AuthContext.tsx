import React, { createContext, useContext, useState, ReactNode } from 'react';
import { User } from '../types';
import { mockDrivers } from '../data/mock';

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string, userType: string) => Promise<User | null>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);

  const login = async (email: string, password: string, userType: string): Promise<User | null> => {
    // Simulação de login com senha única para teste
    if (password !== '123456') {
        return null; // Senha incorreta para qualquer login de teste
    }

    let mockUser: User | null = null;

    if (userType === 'pessoa_fisica') {
      mockUser = {
        id: 'pf_123',
        email: email,
        name: 'João da Silva (Teste)',
        userType: 'pessoa_fisica',
        cpf: '123.456.789-00',
        phone: '(41) 99999-8888',
        address: {
          cep: '80000-000',
          street: 'Rua das Flores',
          number: '123',
          neighborhood: 'Centro',
          city: 'Curitiba',
          state: 'PR'
        }
      };
    } else if (userType === 'clinica') {
      mockUser = {
        id: 'clinic_456',
        email: email,
        name: 'Clínica Vet Top (Teste)',
        userType: 'clinica',
        cnpj: '11.222.333/0001-44',
        phone: '(41) 3333-4444',
        address: {
          cep: '81000-100',
          street: 'Avenida das Clínicas',
          number: '789',
          neighborhood: 'Batel',
          city: 'Curitiba',
          state: 'PR'
        }
      };
    } else if (userType === 'funcionarios') {
        // Tenta logar como motorista específico primeiro
        const driverData = mockDrivers.find(d => d.email.toLowerCase() === email.toLowerCase());
        if (driverData) {
            mockUser = {
                id: driverData.id,
                email: driverData.email,
                name: driverData.name,
                userType: 'funcionario',
                role: 'motorista',
                phone: driverData.phone,
                address: { cep: '', street: '', number: '', neighborhood: '', city: '', state: '' }
            };
        } else {
            // Lógica para outros funcionários com logins compartilhados
            const roleRegex = /^(administrador|receptor|representante|financeiro_?junior|financeiro_?master|gerencia|operacional)(\d*)@gmail\.com$/i;
            const match = email.toLowerCase().match(roleRegex);

            if (match) {
                let roleStr = match[1];
                
                // Normaliza o nome do papel para corresponder ao tipo User['role']
                if (roleStr === 'financeirojunior') roleStr = 'financeiro_junior';
                if (roleStr === 'financeiromaster') roleStr = 'financeiro_master';

                const role = roleStr as User['role'];
                const number = match[2] || '1'; // Se não houver número, assume 1
                
                mockUser = {
                    id: `func_${role}_${number}`,
                    email: email,
                    name: `${role.charAt(0).toUpperCase() + role.slice(1).replace(/_/g, ' ')} ${number} (Teste)`,
                    userType: 'funcionario',
                    role: role,
                    phone: `(41) 9${number}${number}${number}${number}${number}-0000`,
                    address: { cep: '', street: '', number: '', neighborhood: '', city: '', state: '' }
                };
            }
        }
    }

    if (mockUser) {
      setUser(mockUser);
      return mockUser;
    }

    return null;
  };

  const logout = () => {
    setUser(null);
  };

  const value = {
    user,
    login,
    logout,
    isAuthenticated: !!user,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
