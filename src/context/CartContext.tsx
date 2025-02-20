import React, { createContext, useContext, useReducer } from 'react';
import { Product, CartState, Size, CartItem } from '../types';

type CartAction =
  | { type: 'SET_BUSINESS'; payload: string }
  | { type: 'ADD_TO_CART'; payload: { size?: Size; products: Product[] } }
  | { type: 'REMOVE_FROM_CART'; payload: number }
  | { type: 'UPDATE_QUANTITY'; payload: { index: number; quantity: number } }
  | { type: 'CLEAR_CART' };

const CartContext = createContext<{
  state: CartState;
  dispatch: React.Dispatch<CartAction>;
} | null>(null);

const initialState: CartState = {
  businessId: null,
  items: [],
  total: 0,
};

function calculateItemPrice(item: CartItem): number {
  if (item.size) {
    return item.size.price * item.quantity;
  }
  return item.products[0].price * item.quantity;
}

function cartReducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case 'SET_BUSINESS': {
      if (state.businessId && state.businessId !== action.payload) {
        // Clear cart if switching businesses
        return {
          businessId: action.payload,
          items: [],
          total: 0,
        };
      }
      return {
        ...state,
        businessId: action.payload,
      };
    }

    case 'ADD_TO_CART': {
      const newItem: CartItem = {
        size: action.payload.size,
        products: action.payload.products,
        quantity: 1
      };

      return {
        ...state,
        items: [...state.items, newItem],
        total: state.total + calculateItemPrice(newItem),
      };
    }

    case 'REMOVE_FROM_CART': {
      const itemToRemove = state.items[action.payload];
      return {
        ...state,
        items: state.items.filter((_, index) => index !== action.payload),
        total: state.total - calculateItemPrice(itemToRemove),
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
        (total, item) => total + calculateItemPrice(item),
        0
      );

      return {
        ...state,
        items: updatedItems,
        total: newTotal,
      };
    }

    case 'CLEAR_CART':
      return {
        ...state,
        items: [],
        total: 0,
      };

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