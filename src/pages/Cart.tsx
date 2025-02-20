import React, { useState, useEffect } from 'react';
import { useCart } from '../context/CartContext';
import { Trash2, Plus, Minus } from 'lucide-react';
import { CheckoutForm } from '../components/CheckoutForm';
import { CustomerInfo } from '../types';
import { supabase } from '../lib/supabase';

export function Cart() {
  const { state, dispatch } = useCart();
  const [showCheckout, setShowCheckout] = useState(false);
  const [businessWhatsapp, setBusinessWhatsapp] = useState<string | null>(null);

  useEffect(() => {
    async function loadBusinessDetails() {
      if (state.businessId) {
        const { data } = await supabase
          .from('businesses')
          .select('whatsapp')
          .eq('id', state.businessId)
          .single();
        
        if (data) {
          setBusinessWhatsapp(data.whatsapp);
        }
      }
    }

    loadBusinessDetails();
  }, [state.businessId]);

  const handleUpdateQuantity = (index: number, newQuantity: number) => {
    if (newQuantity < 1) return;
    dispatch({ type: 'UPDATE_QUANTITY', payload: { index, quantity: newQuantity } });
  };

  const handleRemoveItem = (index: number) => {
    dispatch({ type: 'REMOVE_FROM_CART', payload: index });
  };

  const handleCheckout = async (customerInfo: CustomerInfo) => {
    if (!businessWhatsapp || !state.businessId) {
      alert('Erro ao processar pedido. Por favor, tente novamente.');
      return;
    }

    try {
      // Salvar o pedido no banco de dados
      const { error: orderError } = await supabase
        .from('orders')
        .insert([{
          business_id: state.businessId,
          customer_name: customerInfo.name,
          customer_phone: customerInfo.phone,
          customer_address: customerInfo.address,
          customer_complement: customerInfo.complement,
          payment_method: customerInfo.paymentMethod,
          change_for: customerInfo.changeFor,
          items: state.items,
          subtotal: state.total,
          delivery_fee: 5,
          total: state.total + 5,
          status: 'pending'
        }]);

      if (orderError) throw orderError;

      // Format WhatsApp message
      const items = state.items.map(item => {
        if (item.size) {
          const products = item.products.map(p => p.name).join(', ');
          return `${item.quantity}x ${item.size.name} - ${products}`;
        }
        return `${item.quantity}x ${item.products[0].name}`;
      }).join('\n');

      const paymentMethods = {
        cash: 'Dinheiro',
        card: 'Cartão',
        pix: 'PIX'
      };

      let message = `🍕 *Novo Pedido*\n\n`;
      message += `*Cliente:* ${customerInfo.name}\n`;
      message += `*Telefone:* ${customerInfo.phone}\n`;
      message += `*Endereço:* ${customerInfo.address}\n`;
      if (customerInfo.complement) {
        message += `*Complemento:* ${customerInfo.complement}\n`;
      }
      message += `\n*Itens do Pedido:*\n${items}\n\n`;
      message += `*Subtotal:* R$ ${state.total.toFixed(2)}\n`;
      message += `*Taxa de Entrega:* R$ 5,00\n`;
      message += `*Total:* R$ ${(state.total + 5).toFixed(2)}\n\n`;
      message += `*Forma de Pagamento:* ${paymentMethods[customerInfo.paymentMethod]}`;
      
      if (customerInfo.paymentMethod === 'cash' && customerInfo.changeFor) {
        message += `\n*Troco para:* R$ ${customerInfo.changeFor.toFixed(2)}`;
      }

      // Encode message for URL
      const encodedMessage = encodeURIComponent(message);
      
      // Open WhatsApp with the business number
      window.open(`https://wa.me/${businessWhatsapp}?text=${encodedMessage}`, '_blank');
      
      // Clear cart
      dispatch({ type: 'CLEAR_CART' });
      setShowCheckout(false);
    } catch (error) {
      console.error('Erro ao salvar pedido:', error);
      alert('Erro ao processar pedido. Por favor, tente novamente.');
    }
  };

  if (state.items.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">Carrinho</h1>
        <div className="bg-white rounded-lg shadow-md p-6 text-center">
          <p className="text-gray-600">Seu carrinho está vazio</p>
          <a href="/" className="text-red-600 hover:text-red-700 mt-4 inline-block">
            Voltar ao Menu
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Carrinho</h1>
      <div className="bg-white rounded-lg shadow-md p-6">
        {state.items.map((item, index) => (
          <div key={index} className="flex items-center py-4 border-b">
            <div className="flex-1">
              <h3 className="text-lg font-semibold">
                {item.size ? `${item.size.name} - ${item.products.map(p => p.name).join(', ')}` : item.products[0].name}
              </h3>
              <div className="flex items-center mt-2">
                <button
                  onClick={() => handleUpdateQuantity(index, item.quantity - 1)}
                  className="text-gray-500 hover:text-red-600"
                >
                  <Minus size={20} />
                </button>
                <span className="mx-4">{item.quantity}</span>
                <button
                  onClick={() => handleUpdateQuantity(index, item.quantity + 1)}
                  className="text-gray-500 hover:text-red-600"
                >
                  <Plus size={20} />
                </button>
                <span className="ml-auto text-lg font-semibold">
                  R$ {((item.size?.price || item.products[0].price) * item.quantity).toFixed(2)}
                </span>
                <button
                  onClick={() => handleRemoveItem(index)}
                  className="ml-4 text-gray-500 hover:text-red-600"
                >
                  <Trash2 size={20} />
                </button>
              </div>
            </div>
          </div>
        ))}
        <div className="mt-6 flex justify-between items-center">
          <div>
            <div className="text-gray-600">Subtotal: R$ {state.total.toFixed(2)}</div>
            <div className="text-gray-600">Taxa de Entrega: R$ 5,00</div>
            <div className="text-2xl font-bold text-red-600">
              Total: R$ {(state.total + 5).toFixed(2)}
            </div>
          </div>
          <button
            onClick={() => setShowCheckout(true)}
            className="bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700"
          >
            Finalizar Pedido
          </button>
        </div>
      </div>

      {showCheckout && (
        <CheckoutForm
          onSubmit={handleCheckout}
          total={state.total}
          onCancel={() => setShowCheckout(false)}
        />
      )}
    </div>
  );
}