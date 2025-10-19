import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { Info, FileText, Plus, Heart, Star, Award, List } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useRemovals } from '../context/RemovalContext';
import RemovalCard from '../components/RemovalCard';
import RemovalDetailsModal from '../components/RemovalDetailsModal';
import { Removal } from '../types';

const PessoaFisicaHome: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { removals, getRemovalsByOwner } = useRemovals();
  const [activeTab, setActiveTab] = useState<'entenda-mais' | 'plano-preventivo' | 'minhas-solicitacoes'>('entenda-mais');
  const [selectedRemoval, setSelectedRemoval] = useState<Removal | null>(null);

  useEffect(() => {
    if (selectedRemoval) {
      const updatedVersion = removals.find(r => r.code === selectedRemoval.code);
      if (updatedVersion) {
        setSelectedRemoval(updatedVersion);
      }
    }
  }, [removals, selectedRemoval?.code]);

  const userRemovals = useMemo(() => {
    if (user) {
      return getRemovalsByOwner(user.id);
    }
    return [];
  }, [user, getRemovalsByOwner, removals]);

  const modalidades = [
    {
      title: 'Modalidade Individual Ouro',
      icon: Award,
      color: 'yellow',
      benefits: [
        'A remoção do seu anjinho, seja onde for, Residência ou Clínica (Verifique cobertura de localidade)',
        'Disponibilizamos uma sala para se despedir do seu anjinho por 20 minutos, data e horários marcados pelo setor Administrativo',
        'Uma urna padrão com as cinzas do seu anjinho',
        'Uma digital em porcelana fria, é feito uma marcação da patinha do seu anjinho em uma massinha de porcelana fria',
        'Uma carteirinha com a marcação da patinha em tinta com um pouquinho do pelinho, para recordação',
        'Certificado de cremação impresso'
      ]
    },
    {
      title: 'Modalidade Individual Prata',
      icon: Star,
      color: 'gray',
      benefits: [
        'A remoção do seu anjinho, seja onde for, Residência ou Clínica (Verifique cobertura de localidade)',
        'Disponibilizamos uma sala para se despedir do seu anjinho por 20 minutos, data e horários marcados pelo setor Administrativo',
        'Uma urna padrão com as cinzas do seu anjinho',
        'Uma carteirinha com a marcação da patinha em tinta com um pouquinho do pelinho, para recordação',
        'Certificado de cremação impresso'
      ]
    },
    {
      title: 'Modalidade Coletivo',
      icon: Heart,
      color: 'green',
      benefits: [
        'A remoção do seu anjinho, seja onde for, Residência ou Clínica (Verifique cobertura de localidade)',
        'Não terá devolução das cinzas pois o seu anjinho será cremado com os demais anjinhos, as cinzas dele(a) irá para um jardim, um espaço reservado para essa modalidade no cemitério Parque das Araucárias'
      ]
    }
  ];

  return (
    <Layout title="Dashboard - Pessoa Física">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg p-8 text-white">
            <h1 className="text-3xl font-bold mb-4">Bem-vindo ao Pet Anjinho</h1>
            <p className="text-lg mb-6">Cuidamos do seu anjinho com todo carinho e respeito</p>
            <button
              onClick={() => navigate('/solicitar-remocao')}
              className="bg-white text-blue-600 px-8 py-3 rounded-lg font-semibold text-lg hover:bg-gray-100 transition-colors flex items-center"
            >
              <Plus className="h-6 w-6 mr-2" />
              Solicitar Remoção
            </button>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex flex-wrap">
              <button
                onClick={() => setActiveTab('entenda-mais')}
                className={`px-6 py-4 font-medium border-b-2 transition-colors flex items-center ${
                  activeTab === 'entenda-mais'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <Info className="h-5 w-5 mr-2" />
                Entenda Mais
              </button>
              <button
                onClick={() => setActiveTab('plano-preventivo')}
                className={`px-6 py-4 font-medium border-b-2 transition-colors flex items-center ${
                  activeTab === 'plano-preventivo'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <FileText className="h-5 w-5 mr-2" />
                Fazer um Plano Preventivo
              </button>
              <button
                onClick={() => setActiveTab('minhas-solicitacoes')}
                className={`px-6 py-4 font-medium border-b-2 transition-colors flex items-center ${
                  activeTab === 'minhas-solicitacoes'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <List className="h-5 w-5 mr-2" />
                Minhas Solicitações
              </button>
            </nav>
          </div>

          <div className="p-6">
            {activeTab === 'entenda-mais' && (
              <div className="space-y-8">
                <div className="text-center mb-8">
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">Modalidades de Serviço</h2>
                  <p className="text-gray-600">Escolha a modalidade que melhor atende às suas necessidades</p>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {modalidades.map((modalidade, index) => (
                    <div key={index} className="bg-gray-50 rounded-lg p-6 border-2 border-gray-200 hover:border-blue-300 transition-colors">
                      <div className="text-center mb-4">
                        <div className={`inline-flex p-3 rounded-full mb-3 ${
                          modalidade.color === 'yellow' ? 'bg-yellow-100 text-yellow-600' :
                          modalidade.color === 'gray' ? 'bg-gray-100 text-gray-600' :
                          'bg-green-100 text-green-600'
                        }`}>
                          <modalidade.icon className="h-8 w-8" />
                        </div>
                        <h3 className="text-xl font-bold text-gray-900">{modalidade.title}</h3>
                      </div>
                      <ul className="space-y-3">
                        {modalidade.benefits.map((benefit, benefitIndex) => (
                          <li key={benefitIndex} className="flex items-start">
                            <span className="text-green-500 mr-2 mt-1">•</span>
                            <span className="text-gray-700 text-sm">{benefit}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
                <div className="bg-blue-50 rounded-lg p-6 mt-8">
                  <h4 className="font-semibold text-blue-900 mb-2">Produtos Adicionais</h4>
                  <p className="text-blue-800">
                    Você poderá adquirir lembrancinhas à parte para qualquer das modalidades acima, 
                    desde urnas personalizadas, pingentes, digitais entre outros produtos. 
                    Verifique com o setor administrativo a disponibilidade de produtos.
                  </p>
                </div>
              </div>
            )}

            {activeTab === 'plano-preventivo' && (
              <div className="text-center py-12">
                <div className="bg-gradient-to-br from-green-50 to-blue-50 rounded-lg p-8">
                  <FileText className="h-16 w-16 text-blue-500 mx-auto mb-4" />
                  <h3 className="text-2xl font-bold text-gray-900 mb-4">Plano Preventivo</h3>
                  <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
                    Garanta tranquilidade para você e seu anjinho com nosso plano preventivo. 
                    Entre em contato conosco para conhecer as opções disponíveis e valores.
                  </p>
                  <div className="space-y-4">
                    <p className="text-lg font-semibold text-gray-900">Entre em contato:</p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                      <div className="bg-white rounded-lg p-4 shadow-sm">
                        <p className="font-medium text-gray-900">Telefone</p>
                        <p className="text-blue-600">(41) 3333-4444</p>
                      </div>
                      <div className="bg-white rounded-lg p-4 shadow-sm">
                        <p className="font-medium text-gray-900">WhatsApp</p>
                        <p className="text-green-600">(41) 99999-8888</p>
                      </div>
                      <div className="bg-white rounded-lg p-4 shadow-sm">
                        <p className="font-medium text-gray-900">Email</p>
                        <p className="text-purple-600">contato@petanjinho.com.br</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {activeTab === 'minhas-solicitacoes' && (
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Histórico de Solicitações</h2>
                {userRemovals.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {userRemovals.map(removal => (
                      <RemovalCard key={removal.code} removal={removal} onClick={() => setSelectedRemoval(removal)} />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 text-gray-500">
                    <p>Você ainda não fez nenhuma solicitação de remoção.</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
      <RemovalDetailsModal removal={selectedRemoval} onClose={() => setSelectedRemoval(null)} />
    </Layout>
  );
};

export default PessoaFisicaHome;
