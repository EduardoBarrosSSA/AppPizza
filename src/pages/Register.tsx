import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Store, AlertTriangle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { SubscriptionPlan } from '../types';
import { SubscriptionPlans } from '../components/SubscriptionPlans';

function Register() {
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<string>();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    businessName: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    type: 'pizzaria' as 'pizzaria' | 'pastelaria' | 'crepe' | 'acaraje'
  });

  useEffect(() => {
    loadPlans();
  }, []);

  async function loadPlans() {
    try {
      const { data, error } = await supabase
        .from('subscription_plans')
        .select('*')
        .order('price');

      if (error) throw error;
      setPlans(data);
    } catch (error) {
      console.error('Erro ao carregar planos:', error);
      setError('Erro ao carregar planos de assinatura');
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPlan) {
      setError('Por favor, selecione um plano');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('As senhas não coincidem');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // 1. Criar usuário
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password
      });

      if (authError) {
        if (authError.message === 'User already registered') {
          throw new Error('Este email já está cadastrado. Por favor, use outro email ou faça login.');
        }
        throw authError;
      }

      if (!authData.user) throw new Error('Erro ao criar usuário');

      // 2. Criar estabelecimento com dados da assinatura
      const expiresAt = new Date();
      expiresAt.setMonth(expiresAt.getMonth() + 1);

      const { data: businessData, error: businessError } = await supabase
        .from('businesses')
        .insert([{
          name: formData.businessName,
          type: formData.type,
          whatsapp: formData.phone,
          delivery_fee: 5.00,
          subscription: {
            plan_id: selectedPlan,
            status: 'active',
            expires_at: expiresAt.toISOString()
          }
        }])
        .select()
        .single();

      if (businessError) throw businessError;

      // 3. Criar perfil de administrador
      const { error: profileError } = await supabase
        .from('profiles')
        .insert([{
          user_id: authData.user.id,
          role: 'business_admin',
          business_id: businessData.id
        }]);

      if (profileError) throw profileError;

      // 4. Fazer login do usuário
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password
      });

      if (signInError) throw signInError;

      // Redirecionar para o painel
      navigate('/admin');
    } catch (error) {
      console.error('Erro no cadastro:', error);
      setError(error instanceof Error ? error.message : 'Erro ao criar conta. Por favor, tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-4">
        <div className="flex justify-center mb-8">
          <Store className="h-12 w-12 text-red-600" />
        </div>

        <h1 className="text-3xl font-bold text-center mb-2">
          Crie sua Conta
        </h1>
        <p className="text-center text-gray-600 mb-8">
          Escolha o plano ideal para seu estabelecimento
        </p>

        {/* Planos de Assinatura */}
        <div className="max-w-6xl mx-auto mb-12">
          <SubscriptionPlans
            plans={plans}
            selectedPlan={selectedPlan}
            onSelectPlan={setSelectedPlan}
            loading={loading}
          />
        </div>

        {/* Formulário de Cadastro */}
        <div className="max-w-md mx-auto bg-white rounded-lg shadow-md p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nome do Estabelecimento
              </label>
              <input
                type="text"
                value={formData.businessName}
                onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                className="w-full p-2 border rounded-md focus:ring-red-500 focus:border-red-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tipo de Estabelecimento
              </label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value as typeof formData.type })}
                className="w-full p-2 border rounded-md focus:ring-red-500 focus:border-red-500"
                required
              >
                <option value="pizzaria">Pizzaria</option>
                <option value="pastelaria">Pastelaria</option>
                <option value="crepe">Creperia</option>
                <option value="acaraje">Acarajé</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full p-2 border rounded-md focus:ring-red-500 focus:border-red-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Senha
              </label>
              <input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="w-full p-2 border rounded-md focus:ring-red-500 focus:border-red-500"
                required
                minLength={6}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Confirmar Senha
              </label>
              <input
                type="password"
                value={formData.confirmPassword}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                className="w-full p-2 border rounded-md focus:ring-red-500 focus:border-red-500"
                required
                minLength={6}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                WhatsApp
              </label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full p-2 border rounded-md focus:ring-red-500 focus:border-red-500"
                placeholder="11999999999"
                required
              />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-md p-4">
                <div className="flex">
                  <AlertTriangle className="h-5 w-5 text-red-400" />
                  <p className="ml-3 text-sm text-red-600">{error}</p>
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !selectedPlan}
              className="w-full py-3 px-4 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 disabled:bg-red-300 disabled:cursor-not-allowed"
            >
              {loading ? 'Criando conta...' : 'Criar Conta'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default Register;