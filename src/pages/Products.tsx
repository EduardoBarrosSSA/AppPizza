import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Pizza, Plus, Edit, Trash2, AlertTriangle, Check } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Product, Size, Business, Profile, PriceUnit } from '../types';

function Products() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [business, setBusiness] = useState<Business | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const navigate = useNavigate();

  // Form state with proper initial values
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '0',
    priceUnit: 'unit' as PriceUnit,
    imageUrl: '',
    category: '',
    inStock: true
  });
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  const priceUnits: { value: PriceUnit; label: string }[] = [
    { value: 'unit', label: 'Unidade' },
    { value: 'kg', label: 'Quilograma (kg)' },
    { value: 'g', label: 'Grama (g)' },
    { value: 'l', label: 'Litro (l)' },
    { value: 'ml', label: 'Mililitro (ml)' }
  ];

  useEffect(() => {
    loadData();
  }, [navigate]);

  async function loadData() {
    try {
      // Check authentication
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        navigate('/login');
        return;
      }

      // Get user profile with business data
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*, business:businesses(*)')
        .eq('user_id', session.user.id)
        .single();

      if (profileError) {
        if (profileError.code === 'PGRST116') {
          navigate('/login');
          return;
        }
        throw profileError;
      }

      if (!profileData || !profileData.business_id) {
        navigate('/login');
        return;
      }

      setProfile(profileData);
      setBusiness(profileData.business);

      // Load products
      const { data: productsData, error: productsError } = await supabase
        .from('products')
        .select('*')
        .eq('business_id', profileData.business_id)
        .order('name');

      if (productsError) throw productsError;
      setProducts(productsData || []);

    } catch (err) {
      console.error('Error loading data:', err);
      setError('Erro ao carregar dados. Por favor, tente novamente.');
    } finally {
      setLoading(false);
    }
  }

  // Function to determine default price unit based on category
  const getDefaultPriceUnit = (category: string): PriceUnit => {
    const categoryLower = category.toLowerCase();
    
    // Items typically sold by unit
    if (categoryLower.includes('pizza') || 
        categoryLower.includes('pastel') ||
        categoryLower.includes('yakisoba') ||
        categoryLower.includes('lanche') ||
        categoryLower.includes('porção')) {
      return 'unit';
    }
    
    // Items typically sold by weight
    if (categoryLower.includes('carne') ||
        categoryLower.includes('peixe') ||
        categoryLower.includes('fruta') ||
        categoryLower.includes('legume')) {
      return 'kg';
    }
    
    // Items typically sold by volume
    if (categoryLower.includes('bebida') ||
        categoryLower.includes('suco') ||
        categoryLower.includes('refrigerante')) {
      return 'ml';
    }
    
    // Default to unit if no specific category match
    return 'unit';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    try {
      if (!business) throw new Error('Business not found');

      const productData = {
        business_id: business.id,
        name: formData.name,
        description: formData.description || null,
        price: parseFloat(formData.price),
        price_unit: formData.priceUnit,
        image_url: formData.imageUrl || null,
        category: formData.category || null,
        in_stock: formData.inStock
      };

      if (editingProduct) {
        // Update existing product
        const { error: updateError } = await supabase
          .from('products')
          .update(productData)
          .eq('id', editingProduct.id);

        if (updateError) throw updateError;
        setSuccess('Produto atualizado com sucesso!');
      } else {
        // Create new product
        const { error: insertError } = await supabase
          .from('products')
          .insert([productData]);

        if (insertError) throw insertError;
        setSuccess('Produto cadastrado com sucesso!');
      }

      // Reset form and reload data
      setFormData({
        name: '',
        description: '',
        price: '0',
        priceUnit: 'unit',
        imageUrl: '',
        category: '',
        inStock: true
      });
      setEditingProduct(null);
      setShowForm(false);
      loadData();
    } catch (err) {
      console.error('Error saving product:', err);
      setError('Erro ao salvar produto. Por favor, tente novamente.');
    }
  };

  const handleEdit = (product: Product) => {
    setFormData({
      name: product.name,
      description: product.description || '',
      price: product.price.toString(),
      priceUnit: product.priceUnit || 'unit',
      imageUrl: product.imageUrl || '',
      category: product.category || '',
      inStock: product.inStock
    });
    setEditingProduct(product);
    setShowForm(true);
  };

  const handleDelete = async (productId: string) => {
    if (!confirm('Tem certeza que deseja excluir este produto?')) return;

    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', productId);

      if (error) throw error;
      setSuccess('Produto excluído com sucesso!');
      loadData();
    } catch (err) {
      console.error('Error deleting product:', err);
      setError('Erro ao excluir produto. Por favor, tente novamente.');
    }
  };

  const formatPrice = (price: number, unit: PriceUnit) => {
    return `R$ ${price.toFixed(2)}${unit !== 'unit' ? `/${unit}` : ''}`;
  };

  // Handle category change and update price unit accordingly
  const handleCategoryChange = (category: string) => {
    setFormData(prev => ({
      ...prev,
      category,
      priceUnit: getDefaultPriceUnit(category)
    }));
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
        </div>
      </div>
    );
  }

  if (!profile || !business) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-600">Acesso negado</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">Produtos</h1>
          <p className="text-gray-600">Gerencie seu cardápio</p>
        </div>
        <Pizza className="h-12 w-12 text-red-600" />
      </div>

      {/* Success/Error Messages */}
      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <AlertTriangle className="h-5 w-5 text-red-400 mr-2" />
            <p className="text-red-600">{error}</p>
          </div>
        </div>
      )}

      {success && (
        <div className="mb-4 bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center">
            <Check className="h-5 w-5 text-green-400 mr-2" />
            <p className="text-green-600">{success}</p>
          </div>
        </div>
      )}

      {/* Add Product Button */}
      {!showForm && (
        <button
          onClick={() => setShowForm(true)}
          className="mb-6 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center space-x-2"
        >
          <Plus className="h-5 w-5" />
          <span>Adicionar Produto</span>
        </button>
      )}

      {/* Product Form */}
      {showForm && (
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-xl font-bold mb-4">
            {editingProduct ? 'Editar Produto' : 'Novo Produto'}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nome do Produto
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full p-2 border rounded-md focus:ring-red-500 focus:border-red-500"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Categoria
                </label>
                <input
                  type="text"
                  value={formData.category}
                  onChange={(e) => handleCategoryChange(e.target.value)}
                  className="w-full p-2 border rounded-md focus:ring-red-500 focus:border-red-500"
                  placeholder="Ex: Pizzas, Bebidas, etc."
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Descrição
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full p-2 border rounded-md focus:ring-red-500 focus:border-red-500"
                rows={3}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Preço
                </label>
                <input
                  type="number"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  className="w-full p-2 border rounded-md focus:ring-red-500 focus:border-red-500"
                  step="0.01"
                  min="0"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Unidade
                </label>
                <select
                  value={formData.priceUnit}
                  onChange={(e) => setFormData({ ...formData, priceUnit: e.target.value as PriceUnit })}
                  className="w-full p-2 border rounded-md focus:ring-red-500 focus:border-red-500"
                >
                  {priceUnits.map(unit => (
                    <option key={unit.value} value={unit.value}>
                      {unit.label}
                    </option>
                  ))}
                </select>
                {formData.category && (
                  <p className="mt-1 text-sm text-gray-500">
                    Sugestão para {formData.category}: {
                      priceUnits.find(u => u.value === getDefaultPriceUnit(formData.category))?.label
                    }
                  </p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  URL da Imagem
                </label>
                <input
                  type="url"
                  value={formData.imageUrl}
                  onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                  className="w-full p-2 border rounded-md focus:ring-red-500 focus:border-red-500"
                  placeholder="https://..."
                />
              </div>
            </div>

            <div>
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={formData.inStock}
                  onChange={(e) => setFormData({ ...formData, inStock: e.target.checked })}
                  className="rounded text-red-600 focus:ring-red-500"
                />
                <span className="text-sm font-medium text-gray-700">
                  Produto em estoque
                </span>
              </label>
            </div>

            <div className="flex justify-end space-x-4">
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  setEditingProduct(null);
                  setFormData({
                    name: '',
                    description: '',
                    price: '0',
                    priceUnit: 'unit',
                    imageUrl: '',
                    category: '',
                    inStock: true
                  });
                }}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                {editingProduct ? 'Atualizar' : 'Cadastrar'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Products List */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Produto
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Categoria
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Preço
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {products.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-4 text-center text-gray-500">
                    Nenhum produto cadastrado
                  </td>
                </tr>
              ) : (
                products.map((product) => (
                  <tr key={product.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {product.imageUrl && (
                          <img
                            src={product.imageUrl}
                            alt={product.name}
                            className="h-10 w-10 rounded-full object-cover mr-3"
                          />
                        )}
                        <div>
                          <div className="font-medium text-gray-900">{product.name}</div>
                          {product.description && (
                            <div className="text-sm text-gray-500">{product.description}</div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {product.category || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatPrice(product.price, product.priceUnit)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        product.inStock
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {product.inStock ? 'Em Estoque' : 'Fora de Estoque'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => handleEdit(product)}
                        className="text-blue-600 hover:text-blue-900 mr-4"
                      >
                        <Edit className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => handleDelete(product.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        <Trash2 className="h-5 w-5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default Products;