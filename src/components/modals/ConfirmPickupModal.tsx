import React, { useState } from 'react';
import { X, User, CheckCircle, Calendar } from 'lucide-react';

interface ConfirmPickupModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (data: { pickedUpBy: string; pickupDate: string }) => void;
    petName: string;
}

const ConfirmPickupModal: React.FC<ConfirmPickupModalProps> = ({ isOpen, onClose, onConfirm, petName }) => {
    const [pickedUpBy, setPickedUpBy] = useState('');
    const [pickupDate, setPickupDate] = useState(new Date().toISOString().split('T')[0]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-[70] p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
                <div className="p-4 border-b flex justify-between items-center">
                    <h2 className="text-xl font-bold text-gray-900 flex items-center">
                        <CheckCircle className="h-6 w-6 mr-3 text-green-500" />
                        Confirmar Retirada
                    </h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X className="h-6 w-6" /></button>
                </div>
                <div className="p-6 space-y-4">
                    <p className="text-gray-700">
                        Confirmar retirada para o pet <strong>{petName}</strong>.
                    </p>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Nome de quem retirou *</label>
                        <div className="relative">
                            <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                            <input
                                type="text"
                                value={pickedUpBy}
                                onChange={(e) => setPickedUpBy(e.target.value)}
                                placeholder="Nome completo"
                                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                required
                                autoFocus
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Data da Retirada *</label>
                        <div className="relative">
                            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                            <input
                                type="date"
                                value={pickupDate}
                                onChange={(e) => setPickupDate(e.target.value)}
                                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                required
                            />
                        </div>
                    </div>
                </div>
                <div className="bg-gray-50 p-4 border-t flex justify-end gap-4">
                    <button onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300">Cancelar</button>
                    <button 
                        onClick={() => onConfirm({ pickedUpBy, pickupDate })} 
                        disabled={!pickedUpBy || !pickupDate}
                        className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
                    >
                        Confirmar
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ConfirmPickupModal;
