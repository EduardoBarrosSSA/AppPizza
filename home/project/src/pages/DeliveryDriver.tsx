import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, Navigation, Package, TrendingUp, Clock } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Order } from '../types';
import { DeliveryValidation } from '../components/DeliveryValidation';

interface Delivery {
  id: string;
  order_id: string;
  fee: number;
  status: 'assigned' | 'picked_up' | 'completed' | 'cancelled';
  created_at: string;
  completed_at: string | null;
  order: Order;
}

interface DriverStats {
  totalDeliveries: number;
  totalEarnings: number;
  pendingDeliveries: number;
}

export function DeliveryDriver() {
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [selectedDelivery, setSelectedDelivery] = useState<Delivery | null>(null);
  const [showValidation, setShowValidation] = useState(false);
  const [stats, setStats] = useState<DriverStats>({
    totalDeliveries: 0,
    totalEarnings: 0,
    pendingDeliveries: 0
  });
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        navigate('/entregador/login');
        return;
      }

      // Get driver phone from user email (which is phone@driver.pedechega.com)
      const phone = session.user.email?.split('@')[0];
      if (!phone) {
        throw new Error('Invalid driver session');
      }

      // First get the driver info
      const { data: driverInfo, error: driverError } = await supabase
        .rpc('get_driver_info', { phone_number: phone });

      if (driverError) {
        console.error('Error getting driver info:', driverError);
        throw new Error('Driver not found');
      }

      if (!driverInfo?.[0]) {
        throw new Error('Driver not found');
      }

      const driver = driverInfo[0];

      // Then load deliveries with order details
      const { data: deliveriesData, error: deliveriesError } = await supabase
        .from('deliveries')
        .select(`
          *,
          order:orders (*)
        `)
        .eq('driver_id', driver.id)
        .not('status', 'eq', 'cancelled')
        .order('created_at', { ascending: false });

      if (deliveriesError) {
        console.error('Error loading deliveries:', deliveriesError);
        throw deliveriesError;
      }

      if (deliveriesData) {
        // Filter out any deliveries without order data
        const validDeliveries = deliveriesData.filter(d => d.order) as Delivery[];
        setDeliveries(validDeliveries);

        // Calculate statistics
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const todayDeliveries = validDeliveries.filter(d => 
          new Date(d.created_at) >= today && d.status === 'completed'
        );
        
        const pending = validDeliveries.filter(d => 
          d.status !== 'completed' && d.status !== 'cancelled'
        );
        
        setStats({
          totalDeliveries: todayDeliveries.length,
          totalEarnings: todayDeliveries.reduce((sum, d) => sum + d.fee, 0),
          pendingDeliveries: pending.length
        });
      }
    } catch (error) {
      console.error('Error loading data:', error);
      navigate('/entregador/login');
    } finally {
      setLoading(false);
    }
  }

  const handleUpdateStatus = async (deliveryId: string, newStatus: Delivery['status']) => {
    try {
      const { error } = await supabase
        .from('deliveries')
        .update({ status: newStatus })
        .eq('id', deliveryId);

      if (error) throw error;

      await loadData();
      setSelectedDelivery(null);
      setShowValidation(false);
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  const openInMaps = (address: string) => {
    const encodedAddress = encodeURIComponent(address);
    window.open(`https://www.google.com/maps/search/?api=1&query=${encodedAddress}`, '_blank');
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">Minhas Entregas</h1>
          <p className="text-gray-600">Painel do Entregador</p>
        </div>
        <Package className="h-12 w-12 text-red-600" />
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600">Entregas Hoje</p>
              <h3 className="text-2xl font-bold">{stats.totalDeliveries}</h3>
            </div>
            <Package className="h-8 w-8 text-red-600" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600">Entregas Pendentes</p>
              <h3 className="text-2xl font-bold">{stats.pendingDeliveries}</h3>
            </div>
            <Clock className="h-8 w-8 text-yellow-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600">Ganhos Hoje</p>
              <h3 className="text-2xl font-bold">R$ {stats.totalEarnings.toFixed(2)}</h3>
            </div>
            <TrendingUp className="h-8 w-8 text-green-500" />
          </div>
        </div>
      </div>

      {/* Lista de Entregas */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-bold mb-6">Entregas</h2>
        <div className="space-y-4">
          {deliveries.length === 0 ? (
            <p className="text-center text-gray-500 py-8">
              Nenhuma entrega encontrada
            </p>
          ) : (
            deliveries.map(delivery => (
              <div
                key={delivery.id}
                className="border rounded-lg p-4 hover:border-red-200 transition-colors"
              >
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold">
                    Pedido #{delivery.order.id.slice(0, 8)}
                  </h3>
                  <span className={`px-2 py-1 text-sm rounded-full font-semibold ${
                    delivery.status === 'completed'
                      ? 'bg-green-100 text-green-800'
                      : delivery.status === 'cancelled'
                      ? 'bg-red-100 text-red-800'
                      : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {delivery.status === 'assigned' ? 'Aguardando Retirada'
                      : delivery.status === 'picked_up' ? 'Em Entrega'
                      : delivery.status === 'completed' ? 'Entregue'
                      : 'Cancelado'}
                  </span>
                </div>

                <div className="space-y-2 mb-4">
                  <p className="text-gray-600">
                    <span className="font-medium">Cliente:</span> {delivery.order.customer_name}
                  </p>
                  <p className="text-gray-600">
                    <span className="font-medium">Telefone:</span> {delivery.order.customer_phone}
                  </p>
                  <div className="flex items-start space-x-2">
                    <MapPin className="h-5 w-5 text-gray-400 mt-1" />
                    <div>
                      <p className="text-gray-600">{delivery.order.customer_address}</p>
                      {delivery.order.customer_complement && (
                        <p className="text-gray-500 text-sm">{delivery.order.customer_complement}</p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <span className="font-semibold text-red-600">
                    Taxa: R$ {delivery.fee.toFixed(2)}
                  </span>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => openInMaps(delivery.order.customer_address)}
                      className="px-4 py-2 text-blue-600 hover:text-blue-800 flex items-center space-x-2"
                    >
                      <Navigation className="h-5 w-5" />
                      <span>Navegar</span>
                    </button>
                    {delivery.status === 'assigned' && (
                      <button
                        onClick={() => handleUpdateStatus(delivery.id, 'picked_up')}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                      >
                        Retirar Pedido
                      </button>
                    )}
                    {delivery.status === 'picked_up' && (
                      <button
                        onClick={() => {
                          setSelectedDelivery(delivery);
                          setShowValidation(true);
                        }}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                      >
                        Confirmar Entrega
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Modal de Validação de Entrega */}
      {showValidation && selectedDelivery && (
        <DeliveryValidation
          order={selectedDelivery.order}
          onClose={() => {
            setSelectedDelivery(null);
            setShowValidation(false);
          }}
          onConfirmDelivery={() => handleUpdateStatus(selectedDelivery.id, 'completed')}
        />
      )}
    </div>
  );
}

export default DeliveryDriver;