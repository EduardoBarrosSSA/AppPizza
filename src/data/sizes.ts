import { PizzaSize } from '../types';

export const pizzaSizes: PizzaSize[] = [
  {
    id: 'p',
    name: 'Pequena',
    maxFlavors: 1,
    price: 25.90,
    description: '20cm - 4 fatias'
  },
  {
    id: 'm',
    name: 'Média',
    maxFlavors: 2,
    price: 35.90,
    description: '25cm - 6 fatias'
  },
  {
    id: 'g',
    name: 'Grande',
    maxFlavors: 3,
    price: 45.90,
    description: '35cm - 8 fatias'
  },
  {
    id: 'f',
    name: 'Família',
    maxFlavors: 4,
    price: 55.90,
    description: '45cm - 12 fatias'
  }
];