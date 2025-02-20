import React, { useState } from 'react';
import { Product, Size, CartItemIngredient, CartItemFlavor } from '../types';
import { useCart } from '../context/CartContext';
import { Plus, Minus, X } from 'lucide-react';

interface ProductBuilderProps {
  product: Product;
  sizes?: Size[];
  availableProducts?: Product[];
  onClose: () => void;
}

export function ProductBuilder({ product, sizes, availableProducts = [], onClose }: ProductBuilderProps) {
  const [selectedSize, setSelectedSize] = useState<Size | undefined>(sizes?.[0]);
  const [selectedFlavors, setSelectedFlavors] = useState<CartItemFlavor[]>([
    {
      productId: product.id,
      name: product.name,
      ingredients: product.ingredients?.map(ing => ({
        id: ing.id,
        name: ing.name,
        price: ing.price,
        included: ing.default
      })) || []
    }
  ]);
  const [quantity, setQuantity] = useState(1);
  const [notes, setNotes] = useState('');
  const { dispatch } = useCart();

  const handleAddFlavor = (newProduct: Product) => {
    if (!selectedSize || selectedFlavors.length >= selectedSize.maxFlavors) return;
    
    setSelectedFlavors([...selectedFlavors, {
      productId: newProduct.id,
      name: newProduct.name,
      ingredients: newProduct.ingredients?.map(ing => ({
        id: ing.id,
        name: ing.name,
        price: ing.price,
        included: ing.default
      })) || []
    }]);
  };

  const handleRemoveFlavor = (index: number) => {
    if (index === 0) return; // Don't remove the first flavor
    setSelectedFlavors(selectedFlavors.filter((_, i) => i !== index));
  };

  const toggleIngredient = (flavorIndex: number, ingredientId: string) => {
    setSelectedFlavors(selectedFlavors.map((flavor, idx) => {
      if (idx === flavorIndex) {
        return {
          ...flavor,
          ingredients: flavor.ingredients.map(ing => 
            ing.id === ingredientId ? { ...ing, included: !ing.included } : ing
          )
        };
      }
      return flavor;
    }));
  };

  const calculateTotal = () => {
    const basePrice = selectedSize ? selectedSize.price : product.price;
    const ingredientsPrice = selectedFlavors.reduce((total, flavor) => 
      total + flavor.ingredients.reduce((sum, ing) => 
        ing.included ? sum + ing.price : sum, 0
      ), 0);
    return (basePrice + ingredientsPrice) * quantity;
  };

  const handleAddToCart = () => {
    dispatch({
      type: 'ADD_TO_CART',
      payload: {
        size: selectedSize,
        products: [product],
        quantity,
        flavors: selectedFlavors,
        notes
      }
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold">Personalizar Pedido</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X size={24} />
          </button>
        </div>

        {/* Size Selection */}
        {sizes && (
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-2">Tamanho:</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {sizes.map((size) => (
                <button
                  key={size.id}
                  onClick={() => {
                    setSelectedSize(size);
                    setSelectedFlavors([selectedFlavors[0]]);
                  }}
                  className={`p-4 rounded-lg border ${
                    selectedSize?.id === size.id
                      ? 'border-red-600 bg-red-50'
                      : 'border-gray-200 hover:border-red-600'
                  }`}
                >
                  <div className="font-semibold">{size.name}</div>
                  <div className="text-sm text-gray-600">{size.description}</div>
                  <div className="text-red-600 font-semibold">
                    R$ {size.price.toFixed(2)}
                  </div>
                  {size.maxFlavors > 1 && (
                    <div className="text-sm text-gray-500">
                      Até {size.maxFlavors} sabores
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Flavors and Ingredients */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-2">
            {selectedFlavors.length > 1 ? 'Sabores:' : 'Ingredientes:'}
          </h3>
          
          {selectedFlavors.map((flavor, flavorIndex) => (
            <div key={flavorIndex} className="mb-4 p-4 border rounded-lg">
              <div className="flex justify-between items-center mb-2">
                <h4 className="font-semibold">{flavor.name}</h4>
                {flavorIndex > 0 && (
                  <button
                    onClick={() => handleRemoveFlavor(flavorIndex)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <X size={20} />
                  </button>
                )}
              </div>
              
              <div className="space-y-2">
                {flavor.ingredients.map((ing) => (
                  <label key={ing.id} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={ing.included}
                      onChange={() => toggleIngredient(flavorIndex, ing.id)}
                      className="rounded text-red-600 focus:ring-red-500"
                    />
                    <span>{ing.name}</span>
                    {ing.price > 0 && (
                      <span className="text-sm text-gray-600">
                        (+R$ {ing.price.toFixed(2)})
                      </span>
                    )}
                  </label>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Add More Flavors */}
        {selectedSize && selectedSize.maxFlavors > 1 && 
         selectedFlavors.length < selectedSize.maxFlavors && (
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-2">Adicionar Sabor:</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {product.allowsMultipleFlavors && 
               availableProducts.filter(p => !selectedFlavors.some(f => f.productId === p.id))
                              .map((p) => (
                <button
                  key={p.id}
                  onClick={() => handleAddFlavor(p)}
                  className="flex items-center p-4 rounded-lg border border-gray-200 hover:border-red-600"
                >
                  <img
                    src={p.imageUrl}
                    alt={p.name}
                    className="w-16 h-16 rounded-full object-cover mr-4"
                  />
                  <div>
                    <h4 className="font-semibold">{p.name}</h4>
                    <p className="text-sm text-gray-600">{p.description}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Quantity Selector */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-2">Quantidade:</h3>
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setQuantity(Math.max(1, quantity - 1))}
              className="p-2 rounded-full hover:bg-gray-100"
            >
              <Minus size={20} />
            </button>
            <span className="text-xl font-semibold">{quantity}</span>
            <button
              onClick={() => setQuantity(quantity + 1)}
              className="p-2 rounded-full hover:bg-gray-100"
            >
              <Plus size={20} />
            </button>
          </div>
        </div>

        {/* Additional Notes */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-2">Observações:</h3>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Alguma observação especial? Ex: sem cebola, mais crocante, etc."
            className="w-full p-2 border rounded-lg focus:ring-red-500 focus:border-red-500"
            rows={3}
          />
        </div>

        {/* Total and Actions */}
        <div className="flex justify-between items-center">
          <div className="text-xl font-bold">
            Total: R$ {calculateTotal().toFixed(2)}
          </div>
          <div className="space-x-4">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:text-gray-800"
            >
              Cancelar
            </button>
            <button
              onClick={handleAddToCart}
              className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
            >
              Adicionar ao Carrinho
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}