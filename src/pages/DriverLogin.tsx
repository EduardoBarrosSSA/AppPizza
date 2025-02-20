import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Truck } from 'lucide-react';

export function DriverLogin() {
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Validate inputs
      if (!phone || !password) {
        throw new Error('Por favor, preencha todos os campos');
      }

      // Clean phone number
      const cleanPhone = phone.replace(/\D/g, '');

      // Validate phone number
      const phoneRegex = /^[0-9]{10,11}$/;
      if (!phoneRegex.test(cleanPhone)) {
        throw new Error('Número de telefone inválido. Use apenas números (10 ou 11 dígitos)');
      }

      // First check if driver exists and is active
      const { data: driverInfo, error: driverError } = await supabase
        .rpc('get_driver_info', { phone_number: cleanPhone });

      if (driverError) {
        console.error('Driver lookup error:', driverError);
        throw new Error('Entregador não encontrado');
      }

      if (!driverInfo?.[0]) {
        throw new Error('Entregador não encontrado');
      }

      const driver = driverInfo[0];

      if (!driver.active) {
        throw new Error('Sua conta está inativa. Entre em contato com o estabelecimento.');
      }

      // Try to sign in
      const email = `${cleanPhone}@driver.pedechega.com`;
      const { data: authData, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (signInError) {
        if (signInError.message.includes('Invalid login credentials')) {
          throw new Error('Senha incorreta');
        }
        throw signInError;
      }

      if (!authData.user) {
        throw new Error('Erro ao fazer login');
      }

      // Update user metadata with driver info
      const { error: updateError } = await supabase.auth.updateUser({
        data: {
          role: 'driver',
          driver_id: driver.id,
          business_id: driver.business_id,
          business_name: driver.business_name
        }
      });

      if (updateError) {
        console.error('Error updating user metadata:', updateError);
      }

      // Redirect to delivery dashboard
      navigate('/delivery');
    } catch (err) {
      console.error('Error during login:', err);
      setError(err instanceof Error ? err.message : 'Erro ao fazer login');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <Truck className="h-12 w-12 text-red-600" />
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Área do Entregador
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Acesse seu painel de entregas
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <form className="space-y-6" onSubmit={handleLogin}>
            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                Telefone
              </label>
              <div className="mt-1">
                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-red-500 focus:border-red-500"
                  placeholder="11999999999"
                />
                <p className="mt-1 text-sm text-gray-500">
                  Apenas números, sem traços ou parênteses
                </p>
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Senha
              </label>
              <div className="mt-1">
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-red-500 focus:border-red-500"
                />
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-md p-4">
                <p className="text-sm text-red-600">
                  {error}
                </p>
              </div>
            )}

            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:bg-red-300"
              >
                {loading ? 'Entrando...' : 'Entrar'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default DriverLogin;