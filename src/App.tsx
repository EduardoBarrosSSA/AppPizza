import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Header } from './components/Header';
import Landing from './pages/Landing';
import Register from './pages/Register';
import { BusinessList } from './pages/BusinessList';
import { Menu } from './pages/Menu';
import Admin from './pages/Admin';
import Products from './pages/Products';
import { SystemAdmin } from './pages/SystemAdmin';
import { Cart } from './pages/Cart';
import { Login } from './pages/Login';
import { DeliveryDriver } from './pages/DeliveryDriver';
import { DriverLogin } from './pages/DriverLogin';
import { DriverAccess } from './pages/DriverAccess';
import { CartProvider } from './context/CartContext';

function AppContent() {
  const location = useLocation();
  const showHeader = !['/', '/register', '/driver', '/driver/login'].includes(location.pathname);

  return (
    <div className="min-h-screen bg-gray-50">
      {showHeader && <Header />}
      <Routes>
        {/* Public routes */}
        <Route path="/" element={<Landing />} />
        <Route path="/register" element={<Register />} />
        <Route path="/businesses" element={<BusinessList />} />
        <Route path="/cart" element={<Cart />} />
        <Route path="/login" element={<Login />} />
        
        {/* Admin routes */}
        <Route path="/admin" element={<Admin />} />
        <Route path="/admin/products" element={<Products />} />
        <Route path="/system-admin" element={<SystemAdmin />} />
        
        {/* Driver routes */}
        <Route path="/driver" element={<DriverAccess />} />
        <Route path="/driver/login" element={<DriverLogin />} />
        <Route path="/driver/dashboard" element={<DeliveryDriver />} />
        
        {/* Outras rotas */}
        <Route path="/entregador" element={<DriverLogin />} />
        <Route path="/entregador/login" element={<DriverLogin />} />
        <Route path="/delivery" element={<DeliveryDriver />} />
        
        {/* Business routes */}
        <Route path="/business/:id" element={<Menu />} />
      </Routes>
    </div>
  );
}

function App() {
  return (
    <CartProvider>
      <Router>
        <AppContent />
      </Router>
    </CartProvider>
  );
}

export default App;