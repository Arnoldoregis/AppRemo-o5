import React from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Building2, X } from 'lucide-react';

interface RequestTypeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const RequestTypeModal: React.FC<RequestTypeModalProps> = ({ isOpen, onClose }) => {
  const navigate = useNavigate();

  if (!isOpen) return null;

  const handleSelect = (path: string) => {
    navigate(path);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
          <X />
        </button>
        <h3 className="text-lg font-semibold text-gray-900 mb-6 text-center">Para quem é a solicitação?</h3>
        <div className="flex justify-center gap-4">
          <button
            onClick={() => handleSelect('/receptor/solicitar-remocao/pf')}
            className="flex flex-col items-center justify-center w-32 h-32 bg-blue-100 text-blue-800 rounded-lg hover:bg-blue-200 transition-colors"
          >
            <User size={40} className="mb-2" />
            <span className="font-semibold">Pessoa Física</span>
          </button>
          <button
            onClick={() => handleSelect('/receptor/solicitar-remocao/clinica')}
            className="flex flex-col items-center justify-center w-32 h-32 bg-green-100 text-green-800 rounded-lg hover:bg-green-200 transition-colors"
          >
            <Building2 size={40} className="mb-2" />
            <span className="font-semibold">Clínica</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default RequestTypeModal;
