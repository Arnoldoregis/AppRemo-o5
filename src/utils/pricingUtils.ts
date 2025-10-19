import { Address, Pet, PriceRegion, PetSpeciesType, Removal, BillingType } from '../types';

const CIDADES_LITORAL_PR = ['Matinhos', 'Guaratuba', 'Pontal do Paraná', 'Antonina', 'Morretes', 'Paranaguá'];

export const getRegionFromAddress = (address: Address): PriceRegion => {
    if (address.state.toUpperCase() === 'SC') {
        return 'sc';
    }
    if (CIDADES_LITORAL_PR.some(city => address.city.toLowerCase() === city.toLowerCase())) {
        return 'litoral';
    }
    return 'curitiba_rm'; // Default
};

export const getSpeciesType = (species: Pet['species']): PetSpeciesType => {
    if (species === 'cachorro' || species === 'gato') {
        return 'normal';
    }
    return 'exotico';
};

export const getBillingType = (paymentMethod: Removal['paymentMethod']): BillingType => {
    return paymentMethod === 'faturado' ? 'faturado' : 'nao_faturado';
};
