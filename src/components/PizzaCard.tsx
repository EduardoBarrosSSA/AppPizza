import React, { useState } from 'react';
import { Pizza } from '../types';
import { PizzaBuilder } from './PizzaBuilder';

interface PizzaCardProps {
  pizza: Pizza;
}

export function PizzaCard({ pizza }: PizzaCardProps) {
  const [showBuilder, setShowBuilder] = useState(false);

  return (
    <>
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <img 
          src={pizza.image} 
          alt={pizza.name} 
          className="w-full h-48 object-cover"
        />
        <div className="p-4">
          <h3 className="text-xl font-bold">{pizza.name}</h3>
          <p className="text-gray-600 mt-1">{pizza.description}</p>
          <div className="mt-2">
            <span className="text-sm text-gray-500">A partir de</span>
            <span className="text-lg font-bold text-red-600 ml-2">
              R$ 25,90
            </span>
          </div>
          <button
            onClick={() => setShowBuilder(true)}
            disabled={!pizza.inStock}
            className={`mt-3 w-full py-2 px-4 rounded ${
              pizza.inStock 
                ? 'bg-red-600 text-white hover:bg-red-700' 
                : 'bg-gray-300 cursor-not-allowed'
            }`}
          >
            {pizza.inStock ? 'Escolher Tamanho' : 'Fora de Estoque'}
          </button>
        </div>
      </div>

      {showBuilder && (
        <PizzaBuilder
          pizza={pizza}
          onClose={() => setShowBuilder(false)}
        />
      )}
    </>
  );
}