import React, { useState } from 'react';
import { Removal } from '../../types';
import { ChevronDown, ChevronUp, Eye, Building } from 'lucide-react';
import { format } from 'date-fns';

interface ClinicRemovalsGroupProps {
  clinicName: string;
  removals: Removal[];
  onRemovalClick: (removal: Removal) => void;
}

const ClinicRemovalsGroup: React.FC<ClinicRemovalsGroupProps> = ({ clinicName, removals, onRemovalClick }) => {
  const [isOpen, setIsOpen] = useState(true);

  return (
    <div className="bg-white rounded-lg shadow-md border border-gray-200">
      <div
        className="p-4 flex justify-between items-center cursor-pointer hover:bg-gray-50"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex items-center gap-4">
          <Building className="h-6 w-6 text-blue-600" />
          <div>
            <h3 className="font-bold text-lg text-gray-800">{clinicName}</h3>
            <p className="text-sm text-gray-500">{removals.length} solicitações</p>
          </div>
        </div>
        <div className="flex items-center gap-6">
          <button className="p-2 rounded-full hover:bg-gray-200">
            {isOpen ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {isOpen && (
        <div className="border-t border-gray-200">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Data</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Código</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Pet</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Tutor</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase">Ações</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {removals.map(removal => (
                  <tr key={removal.code} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm text-gray-600 whitespace-nowrap">{format(new Date(removal.createdAt), 'dd/MM/yyyy')}</td>
                    <td className="px-4 py-3 text-sm text-gray-800 font-mono">{removal.code}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{removal.pet.name}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{removal.tutor.name}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{removal.status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => onRemovalClick(removal)}
                        className="text-blue-600 hover:text-blue-800 p-1 rounded-full hover:bg-blue-100"
                        title="Ver detalhes"
                      >
                        <Eye size={18} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClinicRemovalsGroup;
