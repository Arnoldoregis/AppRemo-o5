import React from 'react';
import { Removal } from '../../types';
import { ShoppingBag } from 'lucide-react';

interface CremadorActionsProps {
  removal: Removal;
  onOpenAssembleBag: () => void;
}

const CremadorActions: React.FC<CremadorActionsProps> = ({ removal, onOpenAssembleBag }) => {
  // Só mostra o botão se o status for 'cremado' (pronto para montar sacola)
  if (removal.status !== 'cremado') {
    return null;
  }

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={onOpenAssembleBag}
        className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 flex items-center gap-2"
      >
        <ShoppingBag size={16} /> Sacola Montada
      </button>
    </div>
  );
};

export default CremadorActions;
