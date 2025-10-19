import React, { useState } from 'react';
import { Removal } from '../../types';
import { useRemovals } from '../../context/RemovalContext';
import { useAuth } from '../../context/AuthContext';
import { Hash, Save, AlertTriangle } from 'lucide-react';

interface SetRemovalCodeProps {
  removal: Removal;
}

const SetRemovalCode: React.FC<SetRemovalCodeProps> = ({ removal }) => {
  const { removals, updateRemoval } = useRemovals();
  const { user } = useAuth();
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSaveCode = () => {
    if (!code.trim()) {
      setError('O código não pode estar em branco.');
      return;
    }
    setIsLoading(true);
    setError('');

    const trimmedCode = code.trim();
    const isDuplicate = removals.some(r => r.code === trimmedCode && r.id !== removal.id);

    if (isDuplicate) {
      setError(`O código "${trimmedCode}" já está em uso. Por favor, insira outro código.`);
      setIsLoading(false);
      return;
    }

    if (user) {
      updateRemoval(removal.id, {
        code: trimmedCode,
        history: [
          ...removal.history,
          {
            date: new Date().toISOString(),
            action: `Código ${trimmedCode} definido por ${user.name.split(' ')[0]}.`,
            user: user.name,
          },
        ],
      });
    }
    
    setIsLoading(false);
    // The modal will re-render and this component will disappear.
  };

  return (
    <div className="mb-6 p-4 bg-yellow-50 border border-yellow-300 rounded-lg">
      <h3 className="text-lg font-semibold text-yellow-900 mb-3 flex items-center">
        <AlertTriangle className="h-5 w-5 mr-2" />
        Definir Código da Remoção
      </h3>
      <div className="flex items-end gap-2">
        <div className="flex-grow">
          <label htmlFor="removal-code-input" className="text-xs font-medium text-gray-700">
            Insira o código único para esta remoção
          </label>
          <div className="relative mt-1">
            <Hash className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              id="removal-code-input"
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Ex: A000001"
              autoFocus
            />
          </div>
        </div>
        <button
          onClick={handleSaveCode}
          disabled={isLoading || !code.trim()}
          className="px-4 py-2 bg-blue-600 text-white rounded-md flex items-center gap-2 hover:bg-blue-700 disabled:opacity-50"
        >
          <Save size={16} />
          Salvar
        </button>
      </div>
      {error && (
        <p className="text-red-600 text-sm mt-2">{error}</p>
      )}
    </div>
  );
};

export default SetRemovalCode;
