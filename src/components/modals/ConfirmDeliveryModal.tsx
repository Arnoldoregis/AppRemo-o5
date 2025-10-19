import React, { useState } from 'react';
import { Removal } from '../../types';
import { X, User, CheckCircle } from 'lucide-react';

interface ConfirmDeliveryModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (deliveryPerson: string) => void;
    removal: Removal | null;
}

const ConfirmDeliveryModal: React.FC<ConfirmDeliveryModalProps> = ({ isOpen, onClose, onConfirm, removal }) => {
    const [deliveryPerson, setDeliveryPerson] = useState('');

    if (!isOpen || !removal) return null;

    const handleConfirmClick = () => {
        if (deliveryPerson.trim()) {
            onConfirm(deliveryPerson);
            onClose();
        } else {
            alert('Por favor, informe o nome de quem realizou a entrega.');
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-[70] p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
                <div className="p-4 border-b flex justify-between items-center">
                    <h2 className="text-xl font-bold text-gray-900 flex items-center">
                        <CheckCircle className="h-6 w-6 mr-3 text-green-500" />
                        Confirmar Entrega Realizada
                    </h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X className="h-6 w-6" /></button>
                </div>
                <div className="p-6 space-y-4">
                    <p className="text-gray-700">
                        Você está confirmando a entrega para o pet <strong>{removal.pet.name}</strong> (código: {removal.code}).
                    </p>
                    <div>
                        <label htmlFor="deliveryPerson" className="block text-sm font-medium text-gray-700 mb-2">
                            Nome de quem realizou a entrega *
                        </label>
                        <div className="relative">
                            <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                            <input
                                id="deliveryPerson"
                                type="text"
                                value={deliveryPerson}
                                onChange={(e) => setDeliveryPerson(e.target.value)}
                                placeholder="Digite o nome do entregador"
                                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                required
                                autoFocus
                            />
                        </div>
                    </div>
                </div>
                <div className="bg-gray-50 p-4 border-t flex justify-end items-center gap-4">
                    <button type="button" onClick={onClose} className="px-6 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300">
                        Cancelar
                    </button>
                    <button
                        type="button"
                        onClick={handleConfirmClick}
                        className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
                        disabled={!deliveryPerson.trim()}
                    >
                        Confirmar
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ConfirmDeliveryModal;
