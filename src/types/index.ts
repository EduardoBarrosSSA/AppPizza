export interface Pizza {
  id: string;
  name: string;
  description: string;
  price: number;
  image: string;
  ingredients: string[];
  inStock: boolean;
}

export interface PizzaSize {
  id: string;
  name: string;
  maxFlavors: number;
  price: number;
  description: string;
}

export interface CartPizza {
  size: PizzaSize;
  flavors: Pizza[];
  quantity: number;
}

export interface CartState {
  items: CartPizza[];
  total: number;
}

export type PaymentMethod = 'cash' | 'card' | 'pix';

export interface CustomerInfo {
  name: string;
  phone: string;
  address: string;
  complement?: string;
  paymentMethod: PaymentMethod;
  changeFor?: number; // Para pagamentos em dinheiro
}

export interface Order {
  id: string;
  customerInfo: CustomerInfo;
  items: CartPizza[];
  total: number;
  deliveryFee: number;
  status: 'pending' | 'preparing' | 'delivering' | 'delivered';
  createdAt: Date;
}