import React from 'react';
import { Check, X } from 'lucide-react';
import { SubscriptionPlan } from '../types';

interface SubscriptionPlansProps {
  plans: SubscriptionPlan[];
  selectedPlan?: string;
  onSelectPlan: (planId: string) => void;
  loading?: boolean;
}

export function SubscriptionPlans({ plans, selectedPlan, onSelectPlan, loading }: SubscriptionPlansProps) {
  const formatFeature = (key: string, value: any) => {
    switch (key) {
      case 'max_products':
        return value === -1 ? 'Produtos ilimitados' : `Até ${value} produtos`;
      case 'max_categories':
        return value === -1 ? 'Categorias ilimitadas' : `Até ${value} categorias`;
      case 'max_images_per_product':
        return value === -1 ? 'Imagens ilimitadas por produto' : `Até ${value} imagens por produto`;
      case 'support_level':
        return `Suporte ${
          value === 'email' ? 'por email' :
          value === 'priority' ? 'prioritário' :
          'dedicado'
        }`;
      case 'allows_delivery':
        return 'Sistema de entregas';
      case 'allows_reviews':
        return 'Sistema de avaliações';
      case 'allows_ingredients':
        return 'Gerenciamento de ingredientes';
      case 'allows_analytics':
        return 'Analytics e relatórios';
      case 'allows_api_access':
        return 'Acesso à API';
      case 'allows_custom_domain':
        return 'Domínio personalizado';
      default:
        return key;
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
      {plans.map(plan => (
        <div
          key={plan.id}
          className={`border rounded-lg p-6 ${
            selectedPlan === plan.id
              ? 'border-red-600 ring-2 ring-red-600 ring-opacity-50'
              : 'border-gray-200 hover:border-red-600'
          }`}
        >
          <div className="text-center mb-6">
            <h3 className="text-2xl font-bold">{plan.name}</h3>
            <p className="text-gray-600 mt-2">{plan.description}</p>
            <div className="mt-4">
              <span className="text-4xl font-bold">R$ {plan.price.toFixed(2)}</span>
              <span className="text-gray-600">/mês</span>
            </div>
          </div>

          <ul className="space-y-4 mb-6">
            {Object.entries(plan.features).map(([key, value]) => (
              <li key={key} className="flex items-center">
                {value ? (
                  <Check className="h-5 w-5 text-green-500 mr-2" />
                ) : (
                  <X className="h-5 w-5 text-red-500 mr-2" />
                )}
                <span className="text-gray-700">
                  {formatFeature(key, value)}
                </span>
              </li>
            ))}
          </ul>

          <button
            onClick={() => onSelectPlan(plan.id)}
            disabled={loading}
            className={`w-full py-3 px-4 rounded-lg font-semibold ${
              selectedPlan === plan.id
                ? 'bg-red-600 text-white hover:bg-red-700'
                : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {loading ? 'Processando...' : 'Selecionar Plano'}
          </button>
        </div>
      ))}
    </div>
  );
}