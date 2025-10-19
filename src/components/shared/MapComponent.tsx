import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { Icon, LatLngExpression } from 'leaflet';
import { Removal } from '../../types';
import { Loader, Home } from 'lucide-react';
import { useRemovals } from '../../context/RemovalContext';

interface MapComponentProps {
  removals: Removal[];
  deliveries?: Removal[];
}

interface Coords {
  lat: number;
  lon: number;
  item: Removal & { itemType: 'removal' | 'delivery' };
}

// SVG for markers
const removalIconSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-map-pin"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>`;
const onTheWayIconSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#16a34a" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-map-pin"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>`;
const deliveryIconSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v2"/><path d="M21 14v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="M3 10h18"/><path d="M12 22V10"/></svg>`;
const homeIconSvg = (color: string) => `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>`;


const createIcon = (svg: string) => new Icon({
  iconUrl: `data:image/svg+xml;base64,${btoa(svg)}`,
  iconSize: [32, 32],
  iconAnchor: [16, 32],
  popupAnchor: [0, -32],
});

const removalIcon = createIcon(removalIconSvg);
const onTheWayIcon = createIcon(onTheWayIconSvg);
const deliveryIcon = createIcon(deliveryIconSvg);
const homeIconBlue = createIcon(homeIconSvg('#3b82f6'));
const homeIconGreen = createIcon(homeIconSvg('#16a34a'));

const companyAddress = { lat: -25.4439, lon: -49.1911 }; // Rua Santa Helena 51, Pinhais

const MapComponent: React.FC<MapComponentProps> = ({ removals, deliveries = [] }) => {
  const [coordinates, setCoordinates] = useState<Coords[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { driverReturningToHQ } = useRemovals();

  useEffect(() => {
    const fetchCoordinates = async () => {
      const itemsToGeocode = [
        ...removals.map(r => ({ ...r, itemType: 'removal' as const })),
        ...deliveries.map(d => ({ ...d, itemType: 'delivery' as const }))
      ];

      if (itemsToGeocode.length === 0) {
        setCoordinates([]);
        return;
      }

      setIsLoading(true);
      const newCoords: Coords[] = [];
      
      for (const item of itemsToGeocode) {
        const address = item.itemType === 'delivery' ? (item.deliveryAddress || item.removalAddress) : item.removalAddress;
        const { street, number, city, state } = address;
        
        if (!street || !city || !state) {
            console.warn(`Skipping geocoding for item ${item.code} due to incomplete address.`);
            continue;
        }

        const addressString = `${street}, ${number || ''}, ${city}, ${state}`;
        const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(addressString)}`;

        try {
          const response = await fetch(url);
          if (!response.ok) {
              console.error(`Geocoding API returned status ${response.status} for address:`, addressString);
              continue;
          }
          const data = await response.json();
          if (data && data.length > 0) {
            newCoords.push({
              lat: parseFloat(data[0].lat),
              lon: parseFloat(data[0].lon),
              item: item,
            });
          } else {
              console.warn("No geocoding results for address:", addressString);
          }
        } catch (error) {
          console.error("Geocoding fetch error for address:", addressString, error);
        }

        await new Promise(resolve => setTimeout(resolve, 1100));
      }

      setCoordinates(newCoords);
      setIsLoading(false);
    };

    fetchCoordinates();
  }, [removals, deliveries]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-96 bg-gray-100 rounded-lg">
        <Loader className="animate-spin h-8 w-8 text-blue-600" />
        <p className="ml-4 text-gray-600">Carregando mapa e localizações...</p>
      </div>
    );
  }

  const itemsToShow = removals.length + deliveries.length;
  if (itemsToShow > 0 && coordinates.length === 0 && !isLoading) {
    return (
        <div className="flex justify-center items-center h-96 bg-gray-100 rounded-lg">
            <p className="text-center text-gray-600 p-4">Não foi possível carregar as localizações. Verifique os endereços das remoções/entregas ou a conexão com a internet.</p>
        </div>
    );
  }

  const mapCenter: LatLngExpression = coordinates.length > 0
    ? [coordinates[0].lat, coordinates[0].lon]
    : [companyAddress.lat, companyAddress.lon];

  return (
    <div className="h-[60vh] w-full rounded-lg overflow-hidden border">
      <MapContainer center={mapCenter} zoom={12} scrollWheelZoom={true} style={{ height: '100%', width: '100%' }}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {/* Company Marker */}
        <Marker position={[companyAddress.lat, companyAddress.lon]} icon={driverReturningToHQ ? homeIconGreen : homeIconBlue}>
            <Popup>
                <div className="space-y-1 text-sm">
                    <p><strong>Empresa</strong></p>
                    <p>Rua Santa Helena 51, Centro, Pinhais</p>
                </div>
            </Popup>
        </Marker>

        {coordinates.map(({ lat, lon, item }) => {
          let icon = removalIcon;
          let popupTitle = 'Remoção';
          let address = item.removalAddress;

          if (item.itemType === 'delivery') {
            icon = deliveryIcon;
            popupTitle = 'Entrega';
            address = item.deliveryAddress || item.removalAddress;
          } else { // It's a removal
            if (item.status === 'a_caminho') {
              icon = onTheWayIcon;
            }
          }

          return (
            <Marker key={item.id} position={[lat, lon]} icon={icon}>
              <Popup>
                <div className="space-y-1 text-sm">
                  <p><strong>{popupTitle}:</strong> {item.code}</p>
                  <p><strong>Pet:</strong> {item.pet.name}</p>
                  <p><strong>Tutor:</strong> {item.tutor.name}</p>
                  <p><strong>Telefone:</strong> {item.tutor.phone}</p>
                  <p><strong>Endereço:</strong> {`${address.street}, ${address.number}`}</p>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
};

export default MapComponent;
