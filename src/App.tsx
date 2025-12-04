import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import HomePage from './pages/HomePage';
import PessoaFisicaHome from './pages/PessoaFisicaHome';
import SolicitarRemocao from './pages/SolicitarRemocao';
import ClinicaHome from './pages/ClinicaHome';
import SolicitarRemocaoClinica from './pages/SolicitarRemocaoClinica';
import FuncionarioDashboard from './pages/FuncionarioDashboard';
import RegisterFuncionario from './pages/RegisterFuncionario';
import ResetPassword from './pages/ResetPassword';
import AgendaDespedida from './pages/AgendaDespedida';
import CremadorDashboardPage from './pages/CremadorDashboardPage';
import ReceptorSolicitarRemocaoPage from './pages/ReceptorSolicitarRemocaoPage';
import RepresentanteGerarContrato from './pages/RepresentanteGerarContrato';
import SplashScreen from './components/SplashScreen';

// Componente para rotas protegidas
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? <>{children}</> : <Navigate to="/" />;
};

function App() {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Exibe a splash screen por 3.5 segundos (tempo suficiente para ver a animação)
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 3500);

    return () => clearTimeout(timer);
  }, []);

  if (isLoading) {
    return <SplashScreen />;
  }

  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/solicitar-remocao" element={<SolicitarRemocao />} />
      <Route path="/solicitar-remocao-clinica" element={<SolicitarRemocaoClinica />} />
      <Route path="/redefinir-senha" element={<ResetPassword />} />
      
      {/* Rotas protegidas */}
      <Route path="/pessoa-fisica" element={
        <ProtectedRoute>
          <PessoaFisicaHome />
        </ProtectedRoute>
      } />
      <Route path="/clinica" element={
        <ProtectedRoute>
          <ClinicaHome />
        </ProtectedRoute>
      } />
      <Route path="/funcionario/:role" element={
        <ProtectedRoute>
          <FuncionarioDashboard />
        </ProtectedRoute>
      } />
      <Route path="/funcionario/adm/cadastro-funcionarios" element={
        <ProtectedRoute>
          <RegisterFuncionario />
        </ProtectedRoute>
      } />
      <Route path="/agenda-despedida" element={
        <ProtectedRoute>
          <AgendaDespedida />
        </ProtectedRoute>
      } />
      <Route path="/painel-cremador" element={
        <ProtectedRoute>
          <CremadorDashboardPage />
        </ProtectedRoute>
      } />
      <Route path="/receptor/solicitar-remocao/:type" element={
        <ProtectedRoute>
          <ReceptorSolicitarRemocaoPage />
        </ProtectedRoute>
      } />
      <Route path="/representante/gerar-contrato" element={
        <ProtectedRoute>
          <RepresentanteGerarContrato />
        </ProtectedRoute>
      } />
    </Routes>
  );
}

export default App;
