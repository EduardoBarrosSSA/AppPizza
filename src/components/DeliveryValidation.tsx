import React, { useState } from 'react';
import { MapPin, Navigation, CheckCircle, AlertTriangle } from 'lucide-react';
import { Order } from '../types';

interface DeliveryValidationProps {
  order: Order;
  onClose: () => void;
  onConfirmDelivery: () => Promise<void>;
  isDriver?: boolean;
}

export function DeliveryValidation({ order, onClose, onConfirmDelivery, isDriver = false }: DeliveryValidationProps) {
  const [validating, setValidating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [locationValidated, setLocationValidated] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<{lat: number; lng: number} | null>(null);

  const validateLocation = () => {
    if (!navigator.geolocation) {
      setError('Geolocalização não é suportada pelo seu navegador');
      return;
    }

    setValidating(true);
    setError(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setCurrentLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude
        });
        setLocationValidated(true);
        setValidating(false);
      },
      (error) => {
        console.error('Geolocation error:', error);
        setError('Erro ao obter localização. Por favor, permita o acesso à sua localização.');
        setValidating(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  };

  const handleConfirmDelivery = async () => {
    if (!locationValidated) {
      setError('Por favor, valide sua localização primeiro');
      return;
    }

    try {
      setValidating(true);
      await onConfirmDelivery();
      onClose();
    } catch (error) {
      console.error('Error confirming delivery:', error);
      setError('Erro ao confirmar entrega. Tente novamente.');
    } finally {
      setValidating(false);
    }
  };

  const openInMaps = () => {
    const address = encodeURIComponent(
      `${order.customer_address}${order.customer_complement ? `, ${order.customer_complement}` : ''}`
    );
    window.open(`https://www.google.com/maps/search/?api=1&query=${address}`, '_blank');
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-lg w-full mx-4">
        <h2 className="text-2xl font-bold mb-4">Validar Entrega</h2>

        {/* Informações do Cliente */}
        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <div className="flex items-center space-x-2 mb-2">
            <MapPin className="h-5 w-5 text-red-600" />
            <h3 className="font-semibold">Endereço de Entrega</h3>
          </div>
          <p className="text-gray-700">{order.customer_name}</p>
          <p className="text-gray-700">{order.customer_phone}</p>
          <p className="text-gray-700">{order.customer_address}</p>
          {order.customer_complement && (
            <p className="text-gray-700">Complemento: {order.customer_complement}</p>
          )}
          <button
            onClick={openInMaps}
            className="mt-2 flex items-center space-x-2 text-blue-600 hover:text-blue-800"
          >
            <Navigation className="h-4 w-4" />
            <span>Abrir no Google Maps</span>
          </button>
        </div>

        {/* Validação de Localização */}
        <div className="space-y-4 mb-6">
          <button
            onClick={validateLocation}
            disabled={validating || locationValidated}
            className={`w-full flex items-center justify-center space-x-2 px-4 py-2 rounded-lg ${
              locationValidated
                ? 'bg-green-100 text-green-800'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            {locationValidated ? (
              <>
                <CheckCircle className="h-5 w-5" />
                <span>Localização Validada</span>
              </>
            ) : (
              <>
                <MapPin className="h-5 w-5" />
                <span>{validating ? 'Validando...' : 'Validar Localização'}</span>
              </>
            )}
          </button>

          {error && (
            <div className="flex items-center space-x-2 text-red-600 text-sm">
              <AlertTriangle className="h-4 w-4" />
              <span>{error}</span>
            </div>
          )}
        </div>

        {/* Botões de Ação */}
        <div className="flex justify-end space-x-4">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 hover:text-gray-800"
          >
            Cancelar
          </button>
          <button
            onClick={handleConfirmDelivery}
            disabled={!locationValidated || validating}
            className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400"
          >
            {validating ? 'Confirmando...' : isDriver ? 'Confirmar Entrega' : 'Validar Entrega'}
          </button>
        </div>
      </div>
    </div>
  );
}