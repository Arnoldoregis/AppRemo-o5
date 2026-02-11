import { Address } from '../types';

// Simple in-memory cache to store geocoding results
const addressCache = new Map<string, { lat: number; lon: number } | null>();

export async function geocodeAddress(address: Address): Promise<{ lat: number; lon: number } | null> {
    const { street, number, city, state } = address;
    if (!street || !city || !state) {
        console.warn("Endereço incompleto para geocodificação:", address);
        return null;
    }
    const addressString = `${street}, ${number || ''}, ${city}, ${state}`;

    // Check cache first
    if (addressCache.has(addressString)) {
        return addressCache.get(addressString) || null;
    }

    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(addressString)}`;

    try {
        const response = await fetch(url);
        if (!response.ok) {
            console.error(`API de geocodificação retornou status ${response.status} para:`, addressString);
            return null;
        }
        const data = await response.json();
        if (data && data.length > 0) {
            const result = {
                lat: parseFloat(data[0].lat),
                lon: parseFloat(data[0].lon),
            };
            // Save to cache
            addressCache.set(addressString, result);
            return result;
        } else {
            console.warn("Nenhum resultado de geocodificação para:", addressString);
            // Cache null result to avoid refetching invalid addresses
            addressCache.set(addressString, null);
            return null;
        }
    } catch (error) {
        console.error("Erro na busca de geocodificação para:", addressString, error);
        return null;
    }
}

// Haversine formula to calculate distance between two points in km
export function calculateDistance(
    coords1: { lat: number; lon: number },
    coords2: { lat: number; lon: number }
): number {
    const R = 6371; // Radius of the Earth in km
    const dLat = (coords2.lat - coords1.lat) * (Math.PI / 180);
    const dLon = (coords2.lon - coords1.lon) * (Math.PI / 180);
    const lat1 = coords1.lat * (Math.PI / 180);
    const lat2 = coords2.lat * (Math.PI / 180);

    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;
    return distance;
}
