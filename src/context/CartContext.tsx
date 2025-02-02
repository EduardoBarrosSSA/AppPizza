import React, { createContext, useContext, useReducer } from 'react';
import { Pizza, CartState, PizzaSize, CartPizza } from '../types';

type CartAction =
  | { type: 'ADD_TO_CART'; payload: { size: PizzaSize; flavors: Pizza[] } }
  | { type: 'REMOVE_FROM_CART'; payload: number }
  | { type: 'UPDATE_QUANTITY'; payload: { index: number; quantity: number } }
  | { type: 'CLEAR_CART' };

const CartContext = createContext<{
  state: CartState;
  dispatch: React.Dispatch<CartAction>;
} | null>(null);

const initialState: CartState = {
  items: [],
  total: 0,
};

function calculatePizzaPrice(pizza: CartPizza): number {
  return pizza.size.price * pizza.quantity;
}

function cartReducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case 'ADD_TO_CART': {
      const newItem: CartPizza = {
        size: action.payload.size,
        flavors: action.payload.flavors,
        quantity: 1
      };

      return {
        items: [...state.items, newItem],
        total: state.total + calculatePizzaPrice(newItem),
      };
    }

    case 'REMOVE_FROM_CART': {
      const itemToRemove = state.items[action.payload];
      return {
        items: state.items.filter((_, index) => index !== action.payload),
        total: state.total - calculatePizzaPrice(itemToRemove),
      };
    }

    case 'UPDATE_QUANTITY': {
      const updatedItems = state.items.map((item, index) => {
        if (index === action.payload.index) {
          return { ...item, quantity: action.payload.quantity };
        }
        return item;
      });

      const newTotal = updatedItems.reduce(
        (total, item) => total + calculatePizzaPrice(item),
        0
      );

      return {
        items: updatedItems,
        total: newTotal,
      };
    }

    case 'CLEAR_CART':
      return initialState;

    default:
      return state;
  }
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(cartReducer, initialState);

  return (
    <CartContext.Provider value={{ state, dispatch }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}