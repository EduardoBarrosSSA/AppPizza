import React from 'react';
import { AlertTriangle, CheckCircle } from 'lucide-react';
import { BusinessSubscription } from '../types';

interface SubscriptionStatusProps {
  subscription?: BusinessSubscription;
}

export function SubscriptionStatus({ subscription }: SubscriptionStatusProps) {
  if (!subscription) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-center">
        <AlertTriangle className="h-5 w-5 text-yellow-500 mr-2" />
        <div>
          <h3 className="font-semibold text-yellow-800">Sem Assinatura Ativa</h3>
          <p className="text-sm text-yellow-600">
            Selecione um plano para ativar sua assinatura
          </p>
        </div>
      </div>
    );
  }

  const isActive = subscription.status === 'active' && new Date(subscription.expires_at) > new Date();
  const expiresAt = new Date(subscription.expires_at).toLocaleDateString();

  return (
    <div className={`border rounded-lg p-4 flex items-center ${
      isActive ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
    }`}>
      {isActive ? (
        <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
      ) : (
        <AlertTriangle className="h-5 w-5 text-red-500 mr-2" />
      )}
      <div>
        <h3 className={`font-semibold ${
          isActive ? 'text-green-800' : 'text-red-800'
        }`}>
          {subscription.plan?.name}
        </h3>
        <p className={`text-sm ${
          isActive ? 'text-green-600' : 'text-red-600'
        }`}>
          {isActive
            ? `Válido até ${expiresAt}`
            : subscription.status === 'cancelled'
            ? 'Assinatura cancelada'
            : 'Assinatura expirada'
          }
        </p>
      </div>
    </div>
  );
}