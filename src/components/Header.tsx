import React from 'react';
import { Truck, LogOut, Package, Smartphone } from 'lucide-react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { CartButton } from './CartButton';
import { supabase } from '../lib/supabase';

export function Header() {
  const navigate = useNavigate();
  const location = useLocation();
  const isAdmin = location.pathname.startsWith('/admin');
  const isDelivery = location.pathname.startsWith('/delivery');

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  return (
    <header className="bg-red-600 text-white shadow-lg">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <Link to="/" className="flex items-center space-x-2">
          <Truck size={32} />
          <span className="text-2xl font-bold">PedeChega</span>
        </Link>
        <nav className="flex items-center space-x-6">
          {isAdmin ? (
            <>
              <Link to="/admin" className="hover:text-red-200">Pedidos</Link>
              <Link to="/admin/products" className="hover:text-red-200">
                <span className="flex items-center space-x-2">
                  <Package size={20} />
                  <span>Produtos</span>
                </span>
              </Link>
            </>
          ) : isDelivery ? (
            <Link to="/delivery" className="hover:text-red-200">
              <span className="flex items-center space-x-2">
                <Truck size={20} />
                <span>Entregas</span>
              </span>
            </Link>
          ) : (
            <>
              <Link to="/" className="hover:text-red-200">Menu</Link>
              <CartButton />
              {/* Admin and Driver links - visible only on desktop */}
              <div className="hidden md:flex items-center space-x-4">
                <Link to="/admin" className="hover:text-red-200">Admin</Link>
                <Link to="/driver" className="hover:text-red-200">
                  <span className="flex items-center space-x-2">
                    <Smartphone size={20} />
                    <span>Entregador</span>
                  </span>
                </Link>
              </div>
            </>
          )}
          <button
            onClick={handleLogout}
            className="flex items-center space-x-2 hover:text-red-200"
            title="Sair"
          >
            <LogOut size={20} />
          </button>
        </nav>
      </div>
    </header>
  );
}