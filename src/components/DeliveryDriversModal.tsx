import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, Check, AlertTriangle } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface DeliveryDriver {
  id: string;
  name: string;
  phone: string;
  active: boolean;
}

interface DeliveryDriversModalProps {
  businessId?: string;
  onClose: () => void;
}

export function DeliveryDriversModal({ businessId, onClose }: DeliveryDriversModalProps) {
  const [drivers, setDrivers] = useState<DeliveryDriver[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    password: ''
  });

  useEffect(() => {
    if (businessId) {
      loadDrivers();
    }
  }, [businessId]);

  async function loadDrivers() {
    if (!businessId) return;

    try {
      const { data, error } = await supabase
        .from('delivery_drivers')
        .select('*')
        .eq('business_id', businessId)
        .order('name');

      if (error) throw error;
      setDrivers(data || []);
    } catch (err) {
      console.error('Erro ao carregar entregadores:', err);
      setError('Erro ao carregar entregadores');
    } finally {
      setLoading(false);
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!businessId) return;

    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      // Validate phone number format
      const phoneRegex = /^[0-9]{10,11}$/;
      if (!phoneRegex.test(formData.phone)) {
        throw new Error('Número de telefone inválido. Use apenas números (10 ou 11 dígitos)');
      }

      // Validate password
      if (formData.password.length < 6) {
        throw new Error('A senha deve ter pelo menos 6 caracteres');
      }

      // Register driver using RPC function
      const { data, error } = await supabase
        .rpc('register_driver', {
          p_name: formData.name,
          p_phone: formData.phone,
          p_business_id: businessId,
          p_password: formData.password
        });

      if (error) {
        if (error.message.includes('already registered')) {
          throw new Error('Este número já está cadastrado');
        }
        throw error;
      }

      setSuccess('Entregador cadastrado com sucesso!');
      setFormData({ name: '', phone: '', password: '' });
      loadDrivers();
    } catch (err) {
      console.error('Erro ao cadastrar entregador:', err);
      setError(err instanceof Error ? err.message : 'Erro ao cadastrar entregador');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (driverId: string, currentActive: boolean) => {
    if (!businessId) return;

    try {
      const { error } = await supabase
        .from('delivery_drivers')
        .update({ active: !currentActive })
        .eq('id', driverId)
        .eq('business_id', businessId);

      if (error) throw error;
      loadDrivers();
    } catch (err) {
      console.error('Erro ao atualizar status do entregador:', err);
      setError('Erro ao atualizar status do entregador');
    }
  };

  const handleDelete = async (driverId: string) => {
    if (!businessId || !confirm('Tem certeza que deseja excluir este entregador?')) return;

    try {
      const { error } = await supabase
        .from('delivery_drivers')
        .delete()
        .eq('id', driverId)
        .eq('business_id', businessId);

      if (error) throw error;
      loadDrivers();
    } catch (err) {
      console.error('Erro ao excluir entregador:', err);
      setError('Erro ao excluir entregador');
    }
  };

  if (!businessId) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6">
          <p className="text-red-600">ID do estabelecimento não fornecido</p>
          <button
            onClick={onClose}
            className="mt-4 px-4 py-2 bg-gray-200 rounded-lg"
          >
            Fechar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Gerenciar Entregadores</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X size={24} />
          </button>
        </div>

        {/* Formulário de Cadastro */}
        <form onSubmit={handleSubmit} className="mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nome do Entregador
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full p-2 border rounded-md focus:ring-red-500 focus:border-red-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Telefone (WhatsApp)
              </label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value.replace(/\D/g, '') })}
                placeholder="11999999999"
                className="w-full p-2 border rounded-md focus:ring-red-500 focus:border-red-500"
                required
              />
              <p className="text-sm text-gray-500 mt-1">
                Apenas números, sem traços ou parênteses
              </p>
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Senha de Acesso
            </label>
            <input
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              className="w-full p-2 border rounded-md focus:ring-red-500 focus:border-red-500"
              required
              minLength={6}
            />
            <p className="text-sm text-gray-500 mt-1">
              Mínimo de 6 caracteres
            </p>
          </div>

          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 rounded-md p-4">
              <div className="flex">
                <AlertTriangle className="h-5 w-5 text-red-400" />
                <p className="ml-3 text-sm text-red-600">{error}</p>
              </div>
            </div>
          )}

          {success && (
            <div className="mb-4 bg-green-50 border border-green-200 rounded-md p-4">
              <div className="flex">
                <Check className="h-5 w-5 text-green-400" />
                <p className="ml-3 text-sm text-green-600">{success}</p>
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={saving}
            className="w-full py-2 px-4 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-red-300 flex items-center justify-center space-x-2"
          >
            <Plus className="h-5 w-5" />
            <span>{saving ? 'Cadastrando...' : 'Cadastrar Entregador'}</span>
          </button>
        </form>

        {/* Lista de Entregadores */}
        <div>
          <h3 className="text-lg font-semibold mb-4">Entregadores Cadastrados</h3>
          <div className="space-y-4">
            {loading ? (
              <div className="flex justify-center py-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
              </div>
            ) : drivers.length === 0 ? (
              <p className="text-center text-gray-500 py-4">
                Nenhum entregador cadastrado
              </p>
            ) : (
              drivers.map(driver => (
                <div
                  key={driver.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div>
                    <h4 className="font-semibold">{driver.name}</h4>
                    <p className="text-sm text-gray-600">{driver.phone}</p>
                  </div>
                  <div className="flex items-center space-x-4">
                    <button
                      onClick={() => handleToggleActive(driver.id, driver.active)}
                      className={`px-3 py-1 rounded-full text-sm font-semibold ${
                        driver.active
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {driver.active ? 'Ativo' : 'Inativo'}
                    </button>
                    <button
                      onClick={() => handleDelete(driver.id)}
                      className="text-red-600 hover:text-red-800"
                    >
                      <Trash2 size={20} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}