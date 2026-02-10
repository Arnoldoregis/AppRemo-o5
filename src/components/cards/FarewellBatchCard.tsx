import React from 'react';
import { Removal } from '../../types';
import RemovalCard from '../RemovalCard';
import { CalendarClock } from 'lucide-react';

interface FarewellBatchCardProps {
    label: string;
    removals: Removal[];
    onSelectRemoval: (removal: Removal) => void;
}

const FarewellBatchCard: React.FC<FarewellBatchCardProps> = ({ label, removals, onSelectRemoval }) => {
    return (
        <div className="bg-white rounded-lg shadow-md border border-purple-200 overflow-hidden mb-6">
            <div className="bg-purple-50 p-4 border-b border-purple-100 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <CalendarClock className="text-purple-600 h-6 w-6" />
                    <h3 className="font-bold text-lg text-purple-900 capitalize">{label}</h3>
                </div>
                <span className="text-sm font-semibold text-purple-700 bg-purple-200 px-3 py-1 rounded-full">
                    {removals.length} {removals.length === 1 ? 'Pet' : 'Pets'}
                </span>
            </div>
            <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {removals.map(removal => (
                    <RemovalCard 
                        key={removal.code} 
                        removal={removal} 
                        onClick={() => onSelectRemoval(removal)} 
                    />
                ))}
            </div>
        </div>
    );
};

export default FarewellBatchCard;
