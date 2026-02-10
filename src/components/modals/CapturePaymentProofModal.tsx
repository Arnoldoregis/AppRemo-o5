import React, { useRef } from 'react';
import { X, Camera, Upload, AlertTriangle, CreditCard, CheckCircle } from 'lucide-react';

interface CapturePaymentProofModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPhotoAttached: (file: File) => void;
  paymentMethod: string;
}

const CapturePaymentProofModal: React.FC<CapturePaymentProofModalProps> = ({ isOpen, onClose, onPhotoAttached, paymentMethod }) => {
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const uploadInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      onPhotoAttached(file);
    }
  };

  const handleAlreadyAttached = () => {
    // Cria um arquivo fictício para representar que o pagamento já foi anexado/validado externamente
    const dummyFile = new File(
        ["Comprovante validado ou anexado previamente pelo motorista."], 
        "comprovante_ja_anexado.txt", 
        { type: "text/plain" }
    );
    onPhotoAttached(dummyFile);
  };

  if (!isOpen) return null;

  const formattedPaymentMethod = paymentMethod === 'credito' ? 'Cartão de Crédito' : 'Cartão de Débito';

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-[70] p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-lg w-full transform transition-all">
        <div className="p-4 border-b flex justify-between items-center">
          <h2 className="text-xl font-bold text-gray-900">Comprovante de Pagamento</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="h-6 w-6" />
          </button>
        </div>
        
        <div className="p-6 text-center">
          <div className="mx-auto h-16 w-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
            <CreditCard className="h-8 w-8 text-blue-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-800">Anexar Comprovante</h3>
          <p className="text-gray-600 mt-2 mb-6">
            O pagamento foi realizado via <strong>{formattedPaymentMethod}</strong>. 
            É obrigatório anexar uma foto do comprovante da maquininha para finalizar.
          </p>

          <div className="space-y-3">
            <input
              type="file"
              accept="image/*"
              capture="environment"
              ref={cameraInputRef}
              onChange={handleFileSelect}
              className="hidden"
            />
            <button
              onClick={() => cameraInputRef.current?.click()}
              className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors text-base"
            >
              <Camera size={20} />
              Abrir Câmera
            </button>

            <input
              type="file"
              accept="image/*"
              ref={uploadInputRef}
              onChange={handleFileSelect}
              className="hidden"
            />
            <button
              onClick={() => uploadInputRef.current?.click()}
              className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-gray-600 text-white rounded-lg font-semibold hover:bg-gray-700 transition-colors text-base"
            >
              <Upload size={20} />
              Carregar da Galeria
            </button>

            <button
              onClick={handleAlreadyAttached}
              className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-colors text-base"
            >
              <CheckCircle size={20} />
              Pagamento já Anexado
            </button>
          </div>
          
          <div className="mt-6 p-3 bg-yellow-50 text-yellow-800 rounded-lg border border-yellow-200 text-xs text-left flex items-start gap-2">
            <AlertTriangle size={24} className="flex-shrink-0" />
            <span>
              Certifique-se de que a foto esteja nítida e legível.
            </span>
          </div>
        </div>

        <div className="bg-gray-50 p-4 border-t text-center">
          <button onClick={onClose} className="text-sm text-gray-600 hover:underline">
            Cancelar e Voltar
          </button>
        </div>
      </div>
    </div>
  );
};

export default CapturePaymentProofModal;
