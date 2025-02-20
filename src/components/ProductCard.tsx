import React, { useState } from 'react';
import { Product, Size } from '../types';
import { ProductBuilder } from './ProductBuilder';

interface ProductCardProps {
  product: Product;
  sizes?: Size[];
  availableProducts?: Product[];
  disabled?: boolean;
}

export function ProductCard({ product, sizes, availableProducts, disabled }: ProductCardProps) {
  const [showBuilder, setShowBuilder] = useState(false);

  const handleClick = () => {
    if (disabled) {
      alert('Este estabelecimento está fechado no momento. Volte no horário de funcionamento para fazer seu pedido.');
      return;
    }
    setShowBuilder(true);
  };

  return (
    <>
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <img 
          src={product.imageUrl} 
          alt={product.name} 
          className="w-full h-48 object-cover"
        />
        <div className="p-4">
          <h3 className="text-xl font-bold">{product.name}</h3>
          <p className="text-gray-600 mt-1">{product.description}</p>
          <div className="mt-2">
            {sizes ? (
              <>
                <span className="text-sm text-gray-500">A partir de</span>
                <span className="text-lg font-bold text-red-600 ml-2">
                  R$ {sizes[0].price.toFixed(2)}
                </span>
              </>
            ) : (
              <span className="text-lg font-bold text-red-600">
                R$ {product.price.toFixed(2)}
              </span>
            )}
          </div>
          <button
            onClick={handleClick}
            disabled={!product.inStock || disabled}
            className={`mt-3 w-full py-2 px-4 rounded ${
              !product.inStock || disabled
                ? 'bg-gray-300 cursor-not-allowed'
                : 'bg-red-600 text-white hover:bg-red-700'
            }`}
          >
            {!product.inStock ? 'Fora de Estoque' : sizes ? 'Escolher Tamanho' : 'Adicionar'}
          </button>
        </div>
      </div>

      {showBuilder && (
        <ProductBuilder
          product={product}
          sizes={sizes}
          availableProducts={availableProducts}
          onClose={() => setShowBuilder(false)}
        />
      )}
    </>
  );
}