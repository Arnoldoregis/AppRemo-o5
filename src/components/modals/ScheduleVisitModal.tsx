import React, { useState, useEffect } from 'react';
import { X, Search } from 'lucide-react';
import { Visit, VisitAddress } from '../../types';

interface ScheduleVisitModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (visit: Omit<Visit, 'id'> & { id?: number }) => void;
  visitToEdit?: Visit | null;
}

const ScheduleVisitModal: React.FC<ScheduleVisitModalProps> = ({ isOpen, onClose, onSave, visitToEdit }) => {
  const [formData, setFormData] = useState({
    name: '',
    contact: '',
    date: '',
    time: '',
    cep: '',
    street: '',
    number: '',
    neighborhood: '',
    city: '',
    state: '',
    status: 'Agendada' as Visit['status'],
  });

  useEffect(() => {
    if (isOpen) {
      if (visitToEdit) {
        const [day, month, year] = visitToEdit.date.split('/');
        const formattedDate = `${year}-${month}-${day}`;
        setFormData({
          name: visitToEdit.name,
          contact: visitToEdit.contact || '',
          date: formattedDate,
          time: visitToEdit.time,
          cep: visitToEdit.address.cep,
          street: visitToEdit.address.street,
          number: visitToEdit.address.number,
          neighborhood: visitToEdit.address.neighborhood,
          city: visitToEdit.address.city,
          state: visitToEdit.address.state,
          status: visitToEdit.status,
        });
      } else {
        // Reset form for new visit
        setFormData({
          name: '', contact: '', date: '', time: '',
          cep: '', street: '', number: '', neighborhood: '', city: '', state: '',
          status: 'Agendada',
        });
      }
    }
  }, [isOpen, visitToEdit]);

  const searchCEP = async () => {
    const cep = formData.cep.replace(/\D/g, '');
    if (cep.length === 8) {
      try {
        const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
        const data = await response.json();
        if (!data.erro) {
          setFormData(prev => ({
            ...prev,
            street: data.logradouro,
            neighborhood: data.bairro,
            city: data.localidade,
            state: data.uf,
          }));
        } else {
          alert('CEP não encontrado.');
        }
      } catch (error) {
        console.error('Erro ao buscar CEP:', error);
        alert('Erro ao buscar CEP.');
      }
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const address: VisitAddress = {
      cep: formData.cep,
      street: formData.street,
      number: formData.number,
      neighborhood: formData.neighborhood,
      city: formData.city,
      state: formData.state,
    };
    const visitData = {
      id: visitToEdit?.id,
      name: formData.name,
      contact: formData.contact,
      date: new Date(formData.date + 'T00:00:00').toLocaleDateString('pt-BR'),
      time: formData.time,
      address,
      status: formData.status,
    };
    onSave(visitData);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-[60] p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full">
        <div className="p-4 border-b flex justify-between items-center">
          <h2 className="text-xl font-bold text-gray-900">{visitToEdit ? 'Editar Visita' : 'Agendar Nova Visita'}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X className="h-6 w-6" /></button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Clínica/Tutor *</label>
                <input type="text" name="name" value={formData.name} onChange={handleInputChange} required className="w-full px-3 py-2 border rounded-md" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Contato</label>
                <input type="text" name="contact" value={formData.contact} onChange={handleInputChange} className="w-full px-3 py-2 border rounded-md" />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Data *</label>
                <input type="date" name="date" value={formData.date} onChange={handleInputChange} required className="w-full px-3 py-2 border rounded-md" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Hora *</label>
                <input type="time" name="time" value={formData.time} onChange={handleInputChange} required className="w-full px-3 py-2 border rounded-md" />
              </div>
            </div>

            <div>
              <h3 className="text-md font-semibold text-gray-800 mb-2">Endereço</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="relative">
                  <label className="block text-sm font-medium text-gray-700 mb-1">CEP</label>
                  <input type="text" name="cep" value={formData.cep} onChange={handleInputChange} placeholder="00000-000" className="w-full px-3 py-2 border rounded-md" />
                  <button type="button" onClick={searchCEP} className="absolute right-2 top-8 text-gray-400 hover:text-gray-600"><Search className="h-5 w-5" /></button>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Rua</label>
                  <input type="text" name="street" value={formData.street} onChange={handleInputChange} className="w-full px-3 py-2 border rounded-md" />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Número</label>
                  <input type="text" name="number" value={formData.number} onChange={handleInputChange} className="w-full px-3 py-2 border rounded-md" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Bairro</label>
                  <input type="text" name="neighborhood" value={formData.neighborhood} onChange={handleInputChange} className="w-full px-3 py-2 border rounded-md" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Cidade</label>
                  <input type="text" name="city" value={formData.city} onChange={handleInputChange} className="w-full px-3 py-2 border rounded-md" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">UF</label>
                  <input type="text" name="state" value={formData.state} onChange={handleInputChange} maxLength={2} className="w-full px-3 py-2 border rounded-md" />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select name="status" value={formData.status} onChange={handleInputChange} className="w-full px-3 py-2 border rounded-md bg-white">
                <option value="Agendada">Agendada</option>
                <option value="Concluída">Concluída</option>
                <option value="Cancelada">Cancelada</option>
              </select>
            </div>
          </div>
          <div className="bg-gray-50 p-4 border-t flex justify-end items-center gap-4">
            <button type="button" onClick={onClose} className="px-6 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300">Cancelar</button>
            <button type="submit" className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">Salvar Agendamento</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ScheduleVisitModal;
