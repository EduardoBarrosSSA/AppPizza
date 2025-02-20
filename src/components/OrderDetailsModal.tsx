import React, { useState, useEffect } from 'react';
import { X, Package, Truck, CheckCircle } from 'lucide-react';
import { Order } from '../types';
import { DeliveryValidation } from './DeliveryValidation';
import { supabase } from '../lib/supabase';

interface OrderDetailsModalProps {
  order: Order;
  onClose: () => void;
  onUpdateStatus: (orderId: string, status: Order['status']) => Promise<void>;
}

interface Driver {
  id: string;
  name: string;
  phone: string;
  active: boolean;
}

interface Delivery {
  id: string;
  driver_id: string;
  status: 'assigned' | 'picked_up' | 'completed' | 'cancelled';
  driver: Driver;
}

export function OrderDetailsModal({ order, onClose, onUpdateStatus }: OrderDetailsModalProps) {
  const [showDeliveryValidation, setShowDeliveryValidation] = useState(false);
  const [selectedDriver, setSelectedDriver] = useState<string>('');
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [delivery, setDelivery] = useState<Delivery | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadDrivers();
    if (order.status === 'delivering') {
      loadDeliveryInfo();
    }
  }, [order.id, order.status]);

  const loadDrivers = async () => {
    try {
      const { data, error } = await supabase
        .from('delivery_drivers')
        .select('*')
        .eq('business_id', order.business_id)
        .eq('active', true)
        .order('name');

      if (error) throw error;
      setDrivers(data || []);
    } catch (err) {
      console.error('Error loading drivers:', err);
      setError('Erro ao carregar entregadores');
    }
  };

  const loadDeliveryInfo = async () => {
    try {
      const { data, error } = await supabase
        .from('deliveries')
        .select(`
          *,
          driver:delivery_drivers (
            id,
            name,
            phone,
            active
          )
        `)
        .eq('order_id', order.id)
        .single();

      if (error) throw error;
      if (data) {
        setDelivery(data as Delivery);
      }
    } catch (err) {
      console.error('Error loading delivery info:', err);
    }
  };

  const statusColors = {
    pending: 'bg-yellow-100 text-yellow-800',
    preparing: 'bg-blue-100 text-blue-800',
    delivering: 'bg-purple-100 text-purple-800',
    delivered: 'bg-green-100 text-green-800',
    cancelled: 'bg-red-100 text-red-800'
  };

  const statusLabels = {
    pending: 'Pendente',
    preparing: 'Preparando',
    delivering: 'Em Entrega',
    delivered: 'Entregue',
    cancelled: 'Cancelado'
  };

  const paymentLabels = {
    cash: 'Dinheiro',
    card: 'Cartão',
    pix: 'PIX'
  };

  const handleStartDelivery = async () => {
    if (!selectedDriver) {
      setError('Por favor, selecione um entregador');
      return;
    }
    setLoading(true);
    setError(null);

    try {
      // Create delivery record
      const { error: deliveryError } = await supabase
        .from('deliveries')
        .insert([{
          order_id: order.id,
          driver_id: selectedDriver,
          status: 'assigned',
          fee: 5.00 // Default delivery fee
        }]);

      if (deliveryError) throw deliveryError;

      // Update order status
      await onUpdateStatus(order.id, 'delivering');
      
      // Load updated delivery info
      await loadDeliveryInfo();
    } catch (err) {
      console.error('Error assigning delivery:', err);
      setError('Erro ao atribuir entrega');
    } finally {
      setLoading(false);
    }
  };

  if (showDeliveryValidation) {
    return (
      <DeliveryValidation
        order={order}
        onClose={() => setShowDeliveryValidation(false)}
        onConfirmDelivery={async () => {
          await onUpdateStatus(order.id, 'delivered');
          setShowDeliveryValidation(false);
        }}
      />
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Pedido #{order.id.slice(0, 8)}</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X size={24} />
          </button>
        </div>

        {/* Status e Ações */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <span className={`px-3 py-1 rounded-full text-sm font-semibold ${statusColors[order.status]}`}>
              {statusLabels[order.status]}
            </span>
            <div className="flex space-x-2">
              {order.status === 'pending' && (
                <button
                  onClick={() => onUpdateStatus(order.id, 'preparing')}
                  className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  <Package className="h-5 w-5" />
                  <span>Iniciar Preparo</span>
                </button>
              )}
              {order.status === 'preparing' && (
                <div className="flex flex-col space-y-2">
                  <div className="flex items-center space-x-2">
                    <select
                      value={selectedDriver}
                      onChange={(e) => setSelectedDriver(e.target.value)}
                      className="p-2 border rounded-md focus:ring-red-500 focus:border-red-500"
                    >
                      <option value="">Selecione um entregador</option>
                      {drivers.map(driver => (
                        <option key={driver.id} value={driver.id}>
                          {driver.name}
                        </option>
                      ))}
                    </select>
                    <button
                      onClick={handleStartDelivery}
                      disabled={loading || !selectedDriver}
                      className="flex items-center space-x-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-purple-300"
                    >
                      <Truck className="h-5 w-5" />
                      <span>{loading ? 'Enviando...' : 'Enviar para Entrega'}</span>
                    </button>
                  </div>
                  {error && (
                    <p className="text-sm text-red-600">{error}</p>
                  )}
                </div>
              )}
              {order.status === 'delivering' && delivery?.driver && (
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">Entregador:</p>
                  <p className="text-sm text-gray-600">{delivery.driver.name}</p>
                  <p className="text-sm text-gray-600">{delivery.driver.phone}</p>
                  <p className="text-sm text-gray-500 mt-1">
                    Status: {
                      delivery.status === 'assigned' ? 'Aguardando Retirada' :
                      delivery.status === 'picked_up' ? 'Em Rota de Entrega' :
                      delivery.status === 'completed' ? 'Entrega Concluída' :
                      'Cancelado'
                    }
                  </p>
                </div>
              )}
            </div>
          </div>
          <span className="text-gray-500 mt-2 block">
            {new Date(order.created_at).toLocaleString()}
          </span>
        </div>

        {/* Customer Info */}
        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <h3 className="font-semibold mb-2">Informações do Cliente</h3>
          <p><span className="font-medium">Nome:</span> {order.customer_name}</p>
          <p><span className="font-medium">Telefone:</span> {order.customer_phone}</p>
          <p><span className="font-medium">Endereço:</span> {order.customer_address}</p>
          {order.customer_complement && (
            <p><span className="font-medium">Complemento:</span> {order.customer_complement}</p>
          )}
          <p>
            <span className="font-medium">Forma de Pagamento:</span> {paymentLabels[order.payment_method]}
            {order.change_for && (
              <span className="ml-2">(Troco para R$ {order.change_for.toFixed(2)})</span>
            )}
          </p>
        </div>

        {/* Order Items */}
        <div className="mb-6">
          <h3 className="font-semibold mb-2">Itens do Pedido</h3>
          <div className="space-y-4">
            {order.items.map((item, index) => (
              <div key={index} className="border-b pb-4">
                <div className="font-medium">
                  {item.size 
                    ? `${item.size.name} - ${item.products.map(p => p.name).join(', ')}`
                    : item.products[0].name
                  }
                  <span className="text-gray-600 ml-2">x{item.quantity}</span>
                </div>
                {item.notes && (
                  <p className="text-sm text-gray-600 mt-1">Obs: {item.notes}</p>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Order Summary */}
        <div className="border-t pt-4">
          <div className="flex justify-between items-center mb-2">
            <span className="text-gray-600">Subtotal:</span>
            <span>R$ {order.subtotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between items-center mb-2">
            <span className="text-gray-600">Taxa de Entrega:</span>
            <span>R$ {order.delivery_fee.toFixed(2)}</span>
          </div>
          <div className="flex justify-between items-center font-bold text-lg">
            <span>Total:</span>
            <span>R$ {order.total.toFixed(2)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}