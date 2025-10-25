import React, { useRef } from 'react';
import { Camera, Upload } from 'lucide-react';

interface CapturePetPhotoProps {
  onPhotoAttached: (file: File) => void;
  onCancel: () => void;
}

const CapturePetPhoto: React.FC<CapturePetPhotoProps> = ({ onPhotoAttached, onCancel }) => {
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const uploadInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      onPhotoAttached(file);
    }
  };

  return (
    <div className="w-full p-4 bg-yellow-50 rounded-lg border border-yellow-300 space-y-4">
      <h4 className="font-semibold text-yellow-900 text-center">
        Favor tirar uma foto do pet
      </h4>
      <p className="text-sm text-yellow-800 text-center">
        Para confirmar a remoção individual, é necessário anexar uma foto do pet.
      </p>
      
      <div className="space-y-2">
        <div className="flex flex-col sm:flex-row gap-4">
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
            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-blue-500 text-white rounded-lg font-semibold hover:bg-blue-600 transition-colors"
          >
            <Camera size={20} />
            Tirar Foto
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
            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gray-600 text-white rounded-lg font-semibold hover:bg-gray-700 transition-colors"
          >
            <Upload size={20} />
            Carregar Imagem
          </button>
        </div>
        <p className="text-xs text-gray-500 text-center pt-1">
          O botão "Tirar Foto" abrirá a câmera do seu dispositivo.
        </p>
      </div>
      
      <div className="text-center">
        <button onClick={onCancel} className="text-sm text-gray-600 hover:underline">
          Cancelar
        </button>
      </div>
    </div>
  );
};

export default CapturePetPhoto;
