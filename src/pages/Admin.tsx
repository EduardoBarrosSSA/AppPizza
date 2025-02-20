import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Package, ShoppingBag, TrendingUp, Store, Clock, Users } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Profile, Business, Order, BusinessHours, SubscriptionPlan } from '../types';
import { OrderDetailsModal } from '../components/OrderDetailsModal';
import { BusinessHoursForm } from '../components/BusinessHoursForm';
import { SubscriptionPlans } from '../components/SubscriptionPlans';
import { SubscriptionStatus } from '../components/SubscriptionStatus';
import { DeliveryDriversModal } from '../components/DeliveryDriversModal';

function Admin() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [business, setBusiness] = useState<Business | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [stats, setStats] = useState({
    totalOrders: 0,
    pendingOrders: 0,
    todayRevenue: 0
  });
  const [businessHours, setBusinessHours] = useState<BusinessHours>({
    sunday: null,
    monday: null,
    tuesday: null,
    wednesday: null,
    thursday: null,
    friday: null,
    saturday: null
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [savingSubscription, setSavingSubscription] = useState(false);
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [showDriversModal, setShowDriversModal] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    loadProfile();
    loadPlans();
  }, []);

  async function loadProfile() {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        navigate('/login');
        return;
      }

      // First get the profile
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', session.user.id)
        .single();

      if (profileError) {
        if (profileError.code === 'PGRST116') {
          navigate('/login');
        }
        throw profileError;
      }

      if (!profileData || !profileData.business_id) {
        navigate('/login');
        return;
      }

      setProfile(profileData);

      // Then get the business data
      const { data: businessData, error: businessError } = await supabase
        .from('businesses')
        .select('*')
        .eq('id', profileData.business_id)
        .single();

      if (businessError) throw businessError;

      if (businessData) {
        setBusiness(businessData);
        await Promise.all([
          loadOrders(businessData.id),
          loadBusinessHours(businessData.id)
        ]);
      }
    } catch (error) {
      console.error('Error loading profile:', error);
      setError('Erro ao carregar perfil. Por favor, tente novamente.');
    } finally {
      setLoading(false);
    }
  }

  async function loadPlans() {
    try {
      const { data, error } = await supabase
        .from('subscription_plans')
        .select('*')
        .order('price');

      if (error) throw error;
      setPlans(data || []);
    } catch (error) {
      console.error('Erro ao carregar planos:', error);
      setError('Erro ao carregar planos de assinatura');
    }
  }

  async function loadOrders(businessId: string) {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const { data: ordersData, error: ordersError } = await supabase
        .from('orders')
        .select('*')
        .eq('business_id', businessId)
        .order('created_at', { ascending: false });

      if (ordersError) throw ordersError;

      if (ordersData) {
        setOrders(ordersData);

        const todayOrders = ordersData.filter(order => 
          new Date(order.created_at) >= today
        );

        setStats({
          totalOrders: todayOrders.length,
          pendingOrders: ordersData.filter(order => order.status === 'pending').length,
          todayRevenue: todayOrders.reduce((sum, order) => sum + order.total, 0)
        });
      }
    } catch (error) {
      console.error('Error loading orders:', error);
      setError('Erro ao carregar pedidos');
    }
  }

  async function loadBusinessHours(businessId: string) {
    try {
      const { data, error } = await supabase
        .from('businesses')
        .select('business_hours')
        .eq('id', businessId)
        .single();

      if (error) throw error;
      
      if (data?.business_hours) {
        setBusinessHours(data.business_hours);
      }
    } catch (error) {
      console.error('Erro ao carregar horários:', error);
    }
  }

  const handleSaveBusinessHours = async (hours: BusinessHours) => {
    if (!business) return;

    try {
      const { error } = await supabase
        .from('businesses')
        .update({ 
          business_hours: hours 
        })
        .eq('id', business.id);

      if (error) throw error;
      
      await loadBusinessHours(business.id);
    } catch (error) {
      console.error('Erro ao salvar horários:', error);
      throw error;
    }
  };

  const handleSelectPlan = async (planId: string) => {
    if (!business) return;

    try {
      setSavingSubscription(true);
      setError(null);

      const expiresAt = new Date();
      expiresAt.setMonth(expiresAt.getMonth() + 1);

      const { error } = await supabase
        .from('businesses')
        .update({
          subscription: {
            plan_id: planId,
            status: 'active',
            expires_at: expiresAt.toISOString()
          }
        })
        .eq('id', business.id);

      if (error) throw error;

      await loadProfile();
      setSelectedPlan(planId);
    } catch (err) {
      console.error('Erro ao atualizar assinatura:', err);
      setError('Erro ao atualizar assinatura. Por favor, tente novamente.');
    } finally {
      setSavingSubscription(false);
    }
  };

  const sendStatusNotification = async (order: Order, newStatus: Order['status']) => {
    const statusMessages = {
      preparing: '🔥 Seu pedido está sendo preparado! Em breve estará pronto para entrega.',
      delivering: '🛵 Boa notícia! Seu pedido saiu para entrega e está a caminho.',
      delivered: '✅ Seu pedido foi entregue! Agradecemos a preferência e bom apetite!',
      cancelled: '❌ Seu pedido foi cancelado. Por favor, entre em contato conosco para mais informações.'
    };

    const message = statusMessages[newStatus];
    if (!message) return;

    const fullMessage = `*Atualização do Pedido #${order.id.slice(0, 8)}*\n\n${message}`;
    const encodedMessage = encodeURIComponent(fullMessage);
    
    window.open(`https://wa.me/55${order.customer_phone}?text=${encodedMessage}`, '_blank');
  };

  const handleUpdateOrderStatus = async (orderId: string, newStatus: Order['status']) => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status: newStatus })
        .eq('id', orderId);

      if (error) throw error;

      const updatedOrder = orders.find(order => order.id === orderId);
      if (updatedOrder) {
        await sendStatusNotification(updatedOrder, newStatus);
      }

      setOrders(orders.map(order => 
        order.id === orderId ? { ...order, status: newStatus } : order
      ));

      if (selectedOrder?.id === orderId) {
        setSelectedOrder({ ...selectedOrder, status: newStatus });
      }

      await loadOrders(business!.id);
    } catch (error) {
      console.error('Erro ao atualizar status do pedido:', error);
    }
  };

  const getStatusColor = (status: Order['status']) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      preparing: 'bg-blue-100 text-blue-800',
      delivering: 'bg-purple-100 text-purple-800',
      delivered: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800'
    };
    return colors[status];
  };

  const getStatusLabel = (status: Order['status']) => {
    const labels = {
      pending: 'Pendente',
      preparing: 'Preparando',
      delivering: 'Em Entrega',
      delivered: 'Entregue',
      cancelled: 'Cancelado'
    };
    return labels[status];
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

  if (!profile || !business) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">Acesso Negado</h1>
        <p>Você não tem permissão para acessar esta área.</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">{business.name}</h1>
          <p className="text-gray-600">Painel de Controle</p>
        </div>
        <Store className="h-12 w-12 text-red-600" />
      </div>

      {/* Cards de Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600">Pedidos Hoje</p>
              <h3 className="text-2xl font-bold">{stats.totalOrders}</h3>
            </div>
            <ShoppingBag className="h-8 w-8 text-red-600" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600">Pedidos Pendentes</p>
              <h3 className="text-2xl font-bold">{stats.pendingOrders}</h3>
            </div>
            <Clock className="h-8 w-8 text-yellow-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600">Faturamento Hoje</p>
              <h3 className="text-2xl font-bold">R$ {stats.todayRevenue.toFixed(2)}</h3>
            </div>
            <TrendingUp className="h-8 w-8 text-green-500" />
          </div>
        </div>
      </div>

      {/* Status da Assinatura */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <h2 className="text-xl font-bold mb-6">Assinatura</h2>
        <SubscriptionStatus subscription={business.subscription} />
        
        {(!business.subscription || business.subscription.status !== 'active') && (
          <>
            <h3 className="text-lg font-semibold mt-8 mb-4">Escolha um Plano</h3>
            <SubscriptionPlans
              plans={plans}
              selectedPlan={selectedPlan}
              onSelectPlan={handleSelectPlan}
              loading={savingSubscription}
            />
          </>
        )}
      </div>

      {/* Card de Entregadores */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold">Entregadores</h2>
          <button
            onClick={() => setShowDriversModal(true)}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center space-x-2"
          >
            <Users className="h-5 w-5" />
            <span>Gerenciar Entregadores</span>
          </button>
        </div>
      </div>

      {/* Horário de Funcionamento */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <BusinessHoursForm
          initialData={businessHours}
          onSave={handleSaveBusinessHours}
        />
      </div>

      {/* Lista de Pedidos */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-bold mb-4">Últimos Pedidos</h2>
        {loading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
          </div>
        ) : orders.length === 0 ? (
          <p className="text-center text-gray-500 py-8">Nenhum pedido encontrado</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="bg-gray-50">
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Pedido
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Cliente
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Total
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Data
                  </th>
                  <th className="px-6 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {orders.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">#{order.id.slice(0, 8)}</td>
                    <td className="px-6 py-4">{order.customer_name}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(order.status)}`}>
                        {getStatusLabel(order.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4">R$ {order.total.toFixed(2)}</td>
                    <td className="px-6 py-4">
                      {new Date(order.created_at).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => setSelectedOrder(order)}
                        className="text-red-600 hover:text-red-800"
                      >
                        Ver Detalhes
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {selectedOrder && (
        <OrderDetailsModal
          order={selectedOrder}
          onClose={() => setSelectedOrder(null)}
          onUpdateStatus={handleUpdateOrderStatus}
        />
      )}

      {showDriversModal && (
        <DeliveryDriversModal
          businessId={business?.id}
          onClose={() => setShowDriversModal(false)}
        />
      )}
    </div>
  );
}

export default Admin;