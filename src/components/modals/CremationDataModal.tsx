import React, { useState, useEffect } from 'react';
import { Removal } from '../../types';
import { X, Calendar, Building } from 'lucide-react';

interface CremationDataModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (data: { date: string; company: 'PETCÈU' | 'SQP' }) => void;
    removal: Removal;
}

const CremationDataModal: React.FC<CremationDataModalProps> = ({ isOpen, onClose, onConfirm, removal }) => {
    const [date, setDate] = useState('');
    const [company, setCompany] = useState<'PETCÈU' | 'SQP' | undefined>(undefined);

    useEffect(() => {
        if (isOpen) {
            setDate(removal.cremationDate || '');
            setCompany(removal.cremationCompany);
        }
    }, [isOpen, removal]);

    if (!isOpen) return null;

    const handleConfirm = () => {
        if (date && company) {
            onConfirm({ date, company });
        } else {
            alert('Por favor, preencha a data e a empresa de cremação.');
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-[70] p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
                <div className="p-4 border-b flex justify-between items-center">
                    <h2 className="text-xl font-bold text-gray-900 flex items-center">
                        <Calendar className="h-6 w-6 mr-3 text-blue-500" />
                        Informar Dados da Cremação
                    </h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X className="h-6 w-6" /></button>
                </div>
                <div className="p-6 space-y-4">
                    <p className="text-gray-700">É necessário informar os dados da cremação para gerar o certificado.</p>
                    {!removal.cremationDate && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Data da Cremação</label>
                            <input
                                type="date"
                                value={date}
                                onChange={(e) => setDate(e.target.value)}
                                className="w-full px-3 py-2 border rounded-md"
                                required
                            />
                        </div>
                    )}
                    {!removal.cremationCompany && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2"><Building className="h-4 w-4 mr-2 inline"/>Empresa de Cremação</label>
                            <div className="flex gap-4">
                                <label className="flex items-center gap-2">
                                    <input type="radio" name="cremationCompanyModal" value="PETCÈU" checked={company === 'PETCÈU'} onChange={() => setCompany('PETCÈU')} />
                                    PETCÈU
                                </label>
                                <label className="flex items-center gap-2">
                                    <input type="radio" name="cremationCompanyModal" value="SQP" checked={company === 'SQP'} onChange={() => setCompany('SQP')} />
                                    SQP
                                </label>
                            </div>
                        </div>
                    )}
                </div>
                <div className="bg-gray-50 p-4 border-t flex justify-end items-center gap-4">
                    <button type="button" onClick={onClose} className="px-6 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300">Cancelar</button>
                    <button type="button" onClick={handleConfirm} className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
                        Confirmar e Gerar
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CremationDataModal;
