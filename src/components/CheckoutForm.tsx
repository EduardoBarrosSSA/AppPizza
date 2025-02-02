import React, { useState } from 'react';
import { CustomerInfo, PaymentMethod } from '../types';
import { CreditCard, Banknote, QrCode } from 'lucide-react';

interface CheckoutFormProps {
  onSubmit: (customerInfo: CustomerInfo) => void;
  total: number;
  onCancel: () => void;
}

export function CheckoutForm({ onSubmit, total, onCancel }: CheckoutFormProps) {
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo>({
    name: '',
    phone: '',
    address: '',
    complement: '',
    paymentMethod: 'cash' as PaymentMethod,
    changeFor: undefined,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(customerInfo);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <h2 className="text-2xl font-bold mb-6">Finalizar Pedido</h2>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Informações do Cliente */}
          <div className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                Nome Completo
              </label>
              <input
                type="text"
                id="name"
                required
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500"
                value={customerInfo.name}
                onChange={(e) => setCustomerInfo({ ...customerInfo, name: e.target.value })}
              />
            </div>
            
            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                Telefone (WhatsApp)
              </label>
              <input
                type="tel"
                id="phone"
                required
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500"
                value={customerInfo.phone}
                onChange={(e) => setCustomerInfo({ ...customerInfo, phone: e.target.value })}
              />
            </div>
            
            <div>
              <label htmlFor="address" className="block text-sm font-medium text-gray-700">
                Endereço de Entrega
              </label>
              <input
                type="text"
                id="address"
                required
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500"
                value={customerInfo.address}
                onChange={(e) => setCustomerInfo({ ...customerInfo, address: e.target.value })}
              />
            </div>
            
            <div>
              <label htmlFor="complement" className="block text-sm font-medium text-gray-700">
                Complemento (opcional)
              </label>
              <input
                type="text"
                id="complement"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500"
                value={customerInfo.complement}
                onChange={(e) => setCustomerInfo({ ...customerInfo, complement: e.target.value })}
              />
            </div>
          </div>

          {/* Método de Pagamento */}
          <div>
            <h3 className="text-lg font-semibold mb-3">Forma de Pagamento</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <button
                type="button"
                onClick={() => setCustomerInfo({ ...customerInfo, paymentMethod: 'cash' })}
                className={`p-4 rounded-lg border flex items-center justify-center space-x-2 ${
                  customerInfo.paymentMethod === 'cash'
                    ? 'border-red-600 bg-red-50'
                    : 'border-gray-200 hover:border-red-600'
                }`}
              >
                <Banknote className="h-5 w-5" />
                <span>Dinheiro</span>
              </button>
              
              <button
                type="button"
                onClick={() => setCustomerInfo({ ...customerInfo, paymentMethod: 'card' })}
                className={`p-4 rounded-lg border flex items-center justify-center space-x-2 ${
                  customerInfo.paymentMethod === 'card'
                    ? 'border-red-600 bg-red-50'
                    : 'border-gray-200 hover:border-red-600'
                }`}
              >
                <CreditCard className="h-5 w-5" />
                <span>Cartão</span>
              </button>
              
              <button
                type="button"
                onClick={() => setCustomerInfo({ ...customerInfo, paymentMethod: 'pix' })}
                className={`p-4 rounded-lg border flex items-center justify-center space-x-2 ${
                  customerInfo.paymentMethod === 'pix'
                    ? 'border-red-600 bg-red-50'
                    : 'border-gray-200 hover:border-red-600'
                }`}
              >
                <QrCode className="h-5 w-5" />
                <span>PIX</span>
              </button>
            </div>

            {/* Campo de troco para pagamento em dinheiro */}
            {customerInfo.paymentMethod === 'cash' && (
              <div className="mt-4">
                <label htmlFor="changeFor" className="block text-sm font-medium text-gray-700">
                  Troco para quanto?
                </label>
                <input
                  type="number"
                  id="changeFor"
                  min={total + 5}
                  step="0.01"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500"
                  value={customerInfo.changeFor || ''}
                  onChange={(e) => setCustomerInfo({ ...customerInfo, changeFor: parseFloat(e.target.value) })}
                />
              </div>
            )}
          </div>

          {/* Resumo do Pedido */}
          <div className="border-t pt-4">
            <div className="flex justify-between items-center mb-2">
              <span>Subtotal:</span>
              <span>R$ {total.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center mb-2">
              <span>Taxa de Entrega:</span>
              <span>R$ 5,00</span>
            </div>
            <div className="flex justify-between items-center font-bold text-lg">
              <span>Total:</span>
              <span>R$ {(total + 5).toFixed(2)}</span>
            </div>
          </div>

          {/* Botões de Ação */}
          <div className="flex justify-end space-x-4">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 text-gray-600 hover:text-gray-800"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
            >
              Confirmar Pedido
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}