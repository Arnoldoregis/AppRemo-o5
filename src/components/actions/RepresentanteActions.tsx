import React, { useRef, useState } from 'react';
import { Removal } from '../../types';
import { useRemovals } from '../../context/RemovalContext';
import { useAuth } from '../../context/AuthContext';
import { Upload, FileCheck } from 'lucide-react';

interface RepresentanteActionsProps {
  removal: Removal;
  onClose: () => void;
}

const RepresentanteActions: React.FC<RepresentanteActionsProps> = ({ removal, onClose }) => {
  const { updateRemoval } = useRemovals();
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    setIsUploading(true);

    const reader = new FileReader();
    reader.onload = (e) => {
      const fileData = `${e.target?.result as string}||${file.name}`;
      
      updateRemoval(removal.id, {
        signedContractUrl: fileData,
        history: [
          ...removal.history,
          {
            date: new Date().toISOString(),
            action: `Contrato assinado anexado por ${user.name}`,
            user: user.name,
          }
        ]
      });
      
      setIsUploading(false);
      // Opcional: fechar modal ou apenas atualizar visualmente
    };
    reader.readAsDataURL(file);
  };

  // Exibe o botão se for plano preventivo OU se tiver um número de contrato gerado
  if (removal.modality !== 'plano_preventivo' && !removal.contractNumber) {
      return null;
  }

  return (
    <div className="flex items-center gap-2">
        <input 
            type="file" 
            ref={fileInputRef} 
            className="hidden" 
            accept=".pdf,.jpg,.jpeg,.png"
            onChange={handleFileChange}
        />
        <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className={`px-4 py-2 text-white rounded-md flex items-center gap-2 disabled:opacity-50 ${
                removal.signedContractUrl ? 'bg-green-600 hover:bg-green-700' : 'bg-blue-600 hover:bg-blue-700'
            }`}
        >
            {isUploading ? 'Arquivando...' : (
                <>
                    {removal.signedContractUrl ? <FileCheck size={16} /> : <Upload size={16} />}
                    {removal.signedContractUrl ? 'Atualizar Contrato Assinado' : 'Anexar Contrato Assinado'}
                </>
            )}
        </button>
    </div>
  );
};

export default RepresentanteActions;
