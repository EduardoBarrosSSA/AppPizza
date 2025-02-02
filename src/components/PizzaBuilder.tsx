import React, { useState } from 'react';
import { Pizza, PizzaSize } from '../types';
import { pizzaSizes } from '../data/sizes';
import { pizzas } from '../data/pizzas';
import { useCart } from '../context/CartContext';

interface PizzaBuilderProps {
  pizza: Pizza;
  onClose: () => void;
}

export function PizzaBuilder({ pizza, onClose }: PizzaBuilderProps) {
  const [selectedSize, setSelectedSize] = useState<PizzaSize>(pizzaSizes[0]);
  const [selectedFlavors, setSelectedFlavors] = useState<Pizza[]>([pizza]);
  const { dispatch } = useCart();

  const handleAddFlavor = (flavor: Pizza) => {
    if (selectedFlavors.length < selectedSize.maxFlavors) {
      setSelectedFlavors([...selectedFlavors, flavor]);
    }
  };

  const handleRemoveFlavor = (index: number) => {
    setSelectedFlavors(selectedFlavors.filter((_, i) => i !== index));
  };

  const handleAddToCart = () => {
    dispatch({
      type: 'ADD_TO_CART',
      payload: { size: selectedSize, flavors: selectedFlavors }
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <h2 className="text-2xl font-bold mb-4">Monte sua Pizza</h2>
        
        {/* Seleção de Tamanho */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-2">Escolha o tamanho:</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {pizzaSizes.map((size) => (
              <button
                key={size.id}
                onClick={() => {
                  setSelectedSize(size);
                  setSelectedFlavors([pizza]);
                }}
                className={`p-4 rounded-lg border ${
                  selectedSize.id === size.id
                    ? 'border-red-600 bg-red-50'
                    : 'border-gray-200 hover:border-red-600'
                }`}
              >
                <div className="font-semibold">{size.name}</div>
                <div className="text-sm text-gray-600">{size.description}</div>
                <div className="text-red-600 font-semibold">R$ {size.price.toFixed(2)}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Sabores Selecionados */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-2">
            Sabores selecionados ({selectedFlavors.length}/{selectedSize.maxFlavors}):
          </h3>
          <div className="flex flex-wrap gap-2">
            {selectedFlavors.map((flavor, index) => (
              <div
                key={index}
                className="bg-red-100 text-red-800 px-3 py-1 rounded-full flex items-center"
              >
                <span>{flavor.name}</span>
                {index > 0 && (
                  <button
                    onClick={() => handleRemoveFlavor(index)}
                    className="ml-2 text-red-600 hover:text-red-800"
                  >
                    ×
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Seleção de Sabores Adicionais */}
        {selectedFlavors.length < selectedSize.maxFlavors && (
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-2">
              Escolha mais sabores (opcional):
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {pizzas
                .filter(p => !selectedFlavors.some(sf => sf.id === p.id))
                .map((flavor) => (
                  <button
                    key={flavor.id}
                    onClick={() => handleAddFlavor(flavor)}
                    className="flex items-center p-4 rounded-lg border border-gray-200 hover:border-red-600 hover:bg-red-50"
                  >
                    <img
                      src={flavor.image}
                      alt={flavor.name}
                      className="w-16 h-16 rounded-full object-cover mr-4"
                    />
                    <div className="flex-1">
                      <h4 className="font-semibold">{flavor.name}</h4>
                      <p className="text-sm text-gray-600">{flavor.description}</p>
                    </div>
                  </button>
                ))}
            </div>
          </div>
        )}

        {/* Botões de Ação */}
        <div className="flex justify-end space-x-4 mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 hover:text-gray-800"
          >
            Cancelar
          </button>
          <button
            onClick={handleAddToCart}
            disabled={selectedFlavors.length === 0}
            className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-gray-400"
          >
            Adicionar ao Carrinho
          </button>
        </div>
      </div>
    </div>
  );
}