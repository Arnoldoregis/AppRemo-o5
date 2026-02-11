import React, { useState, useEffect } from 'react';
import { Removal } from '../../types';
import { X, Check, User, Dog, Calendar } from 'lucide-react';

interface EditCertificateInfoModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (data: { tutorName: string; petName: string; cremationDate: string }) => void;
    removal: Removal;
}

const EditCertificateInfoModal: React.FC<EditCertificateInfoModalProps> = ({ isOpen, onClose, onConfirm, removal }) => {
    const [tutorName, setTutorName] = useState('');
    const [petName, setPetName] = useState('');
    const [cremationDate, setCremationDate] = useState('');

    useEffect(() => {
        if (isOpen && removal) {
            setTutorName(removal.tutor.name);
            setPetName(removal.pet.name);
            setCremationDate(removal.cremationDate || '');
        }
    }, [isOpen, removal]);

    const handleConfirm = () => {
        if (!tutorName.trim() || !petName.trim()) {
            alert('Nome do Tutor e Nome do Pet são obrigatórios.');
            return;
        }
        onConfirm({ tutorName, petName, cremationDate });
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-[80] p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
                <div className="p-4 border-b flex justify-between items-center">
                    <h2 className="text-xl font-bold text-gray-900">Dados do Certificado</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X className="h-6 w-6" /></button>
                </div>
                <div className="p-6 space-y-4">
                    <p className="text-sm text-gray-600 mb-4">Confirme ou edite os dados que aparecerão no certificado.</p>
                    
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Nome do Tutor</label>
                        <div className="relative">
                            <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <input 
                                type="text" 
                                value={tutorName} 
                                onChange={(e) => setTutorName(e.target.value)}
                                className="w-full pl-9 pr-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 outline-none"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Nome do Pet</label>
                        <div className="relative">
                            <Dog className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <input 
                                type="text" 
                                value={petName} 
                                onChange={(e) => setPetName(e.target.value)}
                                className="w-full pl-9 pr-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 outline-none"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Data da Cremação</label>
                        <div className="relative">
                            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <input 
                                type="date" 
                                value={cremationDate} 
                                onChange={(e) => setCremationDate(e.target.value)}
                                className="w-full pl-9 pr-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 outline-none"
                            />
                        </div>
                    </div>
                </div>
                <div className="p-4 border-t bg-gray-50 flex justify-end gap-2">
                    <button onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300">Cancelar</button>
                    <button onClick={handleConfirm} className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center gap-2">
                        <Check size={16} /> Confirmar
                    </button>
                </div>
            </div>
        </div>
    );
};

export default EditCertificateInfoModal;
