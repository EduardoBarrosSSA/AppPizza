import React from 'react';
import { PizzaCard } from '../components/PizzaCard';
import { pizzas } from '../data/pizzas';
import { Pizza } from '../types';
import { useCart } from '../context/CartContext';

export function Menu() {
  const { dispatch } = useCart();

  const handleAddToCart = (pizza: Pizza) => {
    dispatch({ type: 'ADD_TO_CART', payload: pizza });
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Nosso Cardápio</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {pizzas.map((pizza) => (
          <PizzaCard
            key={pizza.id}
            pizza={pizza}
            onAddToCart={handleAddToCart}
          />
        ))}
      </div>
    </div>
  );
}