import React from 'react';
import { Pizza } from 'lucide-react';
import { Link } from 'react-router-dom';
import { CartButton } from './CartButton';

export function Header() {
  return (
    <header className="bg-red-600 text-white shadow-lg">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <Link to="/" className="flex items-center space-x-2">
          <Pizza size={32} />
          <span className="text-2xl font-bold">PizzaExpress</span>
        </Link>
        <nav className="flex items-center space-x-6">
          <Link to="/" className="hover:text-red-200">Menu</Link>
          <CartButton />
          <Link to="/admin" className="hover:text-red-200">Admin</Link>
        </nav>
      </div>
    </header>
  );
}