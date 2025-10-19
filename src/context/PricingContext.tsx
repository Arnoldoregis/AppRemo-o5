import React, { createContext, useContext, useState, ReactNode } from 'react';
import { PriceRegion, PetSpeciesType, BillingType } from '../types';

// Define types
export interface ModalityInfo {
    key: string;
    label: string;
    active: boolean;
}

export type PriceTable = Record<PriceRegion, Record<PetSpeciesType, Record<BillingType, Record<string, Record<string, number>>>>>;

interface PricingContextType {
    priceTable: PriceTable;
    modalities: ModalityInfo[];
    updatePrice: (region: PriceRegion, speciesType: PetSpeciesType, billingType: BillingType, weightRange: string, modalityKey: string, newPrice: number) => void;
    toggleModalityStatus: (modalityKey: string) => void;
    addWeightRange: (region: PriceRegion, speciesType: PetSpeciesType, billingType: BillingType, range: string, prices: Record<string, number>) => void;
    removeWeightRange: (region: PriceRegion, speciesType: PetSpeciesType, billingType: BillingType, range: string) => void;
}

const PricingContext = createContext<PricingContextType | undefined>(undefined);

export const usePricing = () => {
    const context = useContext(PricingContext);
    if (!context) {
        throw new Error('usePricing must be used within a PricingProvider');
    }
    return context;
};

// Initial data generation based on user's request for Curitiba/RM, Não Exótico, Não Faturado
const basePrices: Record<string, Record<string, number>> = {
    '0-5kg': { coletivo: 207.00, individual_prata: 480.00, individual_ouro: 500.00 },
    '6-10kg': { coletivo: 230.00, individual_prata: 780.00, individual_ouro: 830.00 },
    '11-20kg': { coletivo: 255.00, individual_prata: 830.00, individual_ouro: 890.00 },
    '21-40kg': { coletivo: 285.00, individual_prata: 850.00, individual_ouro: 999.00 },
    '41-50kg': { coletivo: 330.00, individual_prata: 870.00, individual_ouro: 1060.00 },
    '51-60kg': { coletivo: 370.00, individual_prata: 890.00, individual_ouro: 1190.00 },
    '61-80kg': { coletivo: 400.00, individual_prata: 1070.00, individual_ouro: 1350.00 },
};

const generateInitialPriceTable = (): PriceTable => {
    const table: Partial<PriceTable> = {};
    const regions: PriceRegion[] = ['curitiba_rm', 'litoral', 'sc'];
    const speciesTypes: PetSpeciesType[] = ['normal', 'exotico'];
    const billingTypes: BillingType[] = ['nao_faturado', 'faturado'];
    const multipliers: Record<PriceRegion, Record<PetSpeciesType, number>> = {
        curitiba_rm: { normal: 1.0, exotico: 1.2 },
        litoral: { normal: 1.1, exotico: 1.3 },
        sc: { normal: 1.2, exotico: 1.4 },
    };

    for (const region of regions) {
        table[region] = {} as Record<PetSpeciesType, Record<BillingType, Record<string, Record<string, number>>>>;
        for (const species of speciesTypes) {
            table[region]![species] = {} as Record<BillingType, Record<string, Record<string, number>>>;
            for (const billing of billingTypes) {
                const billingMultiplier = billing === 'faturado' ? 1.1 : 1.0; // 10% markup for faturado
                const regionMultiplier = multipliers[region][species];
                table[region]![species][billing] = {};
                for (const weightRange in basePrices) {
                    table[region]![species][billing][weightRange] = {};
                    for (const modality in basePrices[weightRange]) {
                        table[region]![species][billing][weightRange][modality] = parseFloat((basePrices[weightRange][modality] * regionMultiplier * billingMultiplier).toFixed(2));
                    }
                }
            }
        }
    }
    return table as PriceTable;
};

const initialPriceTable = generateInitialPriceTable();

const initialModalities: ModalityInfo[] = [
    { key: 'coletivo', label: 'Coletivo', active: true },
    { key: 'individual_prata', label: 'Individual Prata', active: true },
    { key: 'individual_ouro', label: 'Individual Ouro', active: true },
];

export const PricingProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [priceTable, setPriceTable] = useState<PriceTable>(initialPriceTable);
    const [modalities, setModalities] = useState<ModalityInfo[]>(initialModalities);

    const updatePrice = (region: PriceRegion, speciesType: PetSpeciesType, billingType: BillingType, weightRange: string, modalityKey: string, newPrice: number) => {
        setPriceTable(prev => ({
            ...prev,
            [region]: {
                ...prev[region],
                [speciesType]: {
                    ...prev[region][speciesType],
                    [billingType]: {
                        ...prev[region][speciesType][billingType],
                        [weightRange]: {
                            ...prev[region][speciesType][billingType][weightRange],
                            [modalityKey]: newPrice,
                        },
                    },
                },
            },
        }));
    };

    const toggleModalityStatus = (modalityKey: string) => {
        setModalities(prev =>
            prev.map(mod =>
                mod.key === modalityKey ? { ...mod, active: !mod.active } : mod
            )
        );
    };

    const addWeightRange = (region: PriceRegion, speciesType: PetSpeciesType, billingType: BillingType, range: string, prices: Record<string, number>) => {
        setPriceTable(prev => ({
            ...prev,
            [region]: {
                ...prev[region],
                [speciesType]: {
                    ...prev[region][speciesType],
                    [billingType]: {
                        ...prev[region][speciesType][billingType],
                        [range]: prices,
                    },
                },
            },
        }));
    };

    const removeWeightRange = (region: PriceRegion, speciesType: PetSpeciesType, billingType: BillingType, range: string) => {
        setPriceTable(prev => {
            const newTable = { ...prev };
            delete newTable[region][speciesType][billingType][range];
            return newTable;
        });
    };

    const value = {
        priceTable,
        modalities,
        updatePrice,
        toggleModalityStatus,
        addWeightRange,
        removeWeightRange,
    };

    return <PricingContext.Provider value={value}>{children}</PricingContext.Provider>;
};
