import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ProductCard } from '../components/ProductCard';
import { useCart } from '../context/CartContext';
import { Business, Product, Size, Ingredient } from '../types';
import { supabase } from '../lib/supabase';
import { StarRating } from '../components/StarRating';
import { ReviewForm } from '../components/ReviewForm';
import { MessageCircle } from 'lucide-react';
import { BusinessHours as BusinessHoursComponent } from '../components/BusinessHours';

const weekDayMap = {
  0: 'sunday',
  1: 'monday',
  2: 'tuesday',
  3: 'wednesday',
  4: 'thursday',
  5: 'friday',
  6: 'saturday'
} as const;

export function Menu() {
  const { businessSlug } = useParams<{ businessSlug: string }>();
  const navigate = useNavigate();
  const { dispatch } = useCart();
  const [business, setBusiness] = useState<Business | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [sizes, setSizes] = useState<Size[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showReviewForm, setShowReviewForm] = useState(false);

  useEffect(() => {
    async function loadBusinessData() {
      try {
        if (!businessSlug) {
          setError('Business slug is required');
          return;
        }

        // Don't try to load business data for driver URLs
        if (businessSlug === 'driver') {
          navigate('/driver/login');
          return;
        }

        const { data: businessData, error: businessError } = await supabase
          .from('businesses')
          .select('*, reviews(rating), business_hours')
          .eq('slug', businessSlug)
          .single();

        if (businessError) {
          if (businessError.code === 'PGRST116') {
            setError('Business not found');
            return;
          }
          throw businessError;
        }

        if (!businessData) {
          setError('Business not found');
          return;
        }

        const reviews = businessData.reviews as { rating: number }[] || [];
        const avgRating = reviews.length > 0
          ? reviews.reduce((acc, rev) => acc + rev.rating, 0) / reviews.length
          : 0;

        const transformedBusiness: Business = {
          id: businessData.id,
          name: businessData.name,
          type: businessData.type,
          logoUrl: businessData.logo_url,
          deliveryFee: businessData.delivery_fee,
          whatsapp: businessData.whatsapp,
          rating: avgRating,
          reviewCount: reviews.length,
          businessHours: businessData.business_hours
        };

        setBusiness(transformedBusiness);
        dispatch({ type: 'SET_BUSINESS', payload: businessData.id });

        // Example ingredients for customization
        const defaultIngredients: Ingredient[] = [
          { id: '1', name: 'Molho de Tomate', price: 0, optional: false, default: true },
          { id: '2', name: 'Mozzarella', price: 0, optional: false, default: true },
          { id: '3', name: 'Orégano', price: 0, optional: true, default: true },
          { id: '4', name: 'Azeitonas', price: 2, optional: true, default: false },
          { id: '5', name: 'Cebola', price: 1, optional: true, default: false },
          { id: '6', name: 'Pimenta', price: 1, optional: true, default: false }
        ];

        // Static products with ingredients
        const staticPizzas: Product[] = [
          {
            id: '1',
            businessId: businessData.id,
            name: 'Margherita',
            description: 'Molho de tomate, mozzarella fresca e manjericão',
            price: 25.90,
            imageUrl: 'https://images.unsplash.com/photo-1604068549290-dea0e4a305ca',
            inStock: true,
            ingredients: defaultIngredients,
            category: 'Pizzas Tradicionais',
            allowsMultipleFlavors: true
          },
          {
            id: '2',
            businessId: businessData.id,
            name: 'Pepperoni',
            description: 'Pepperoni, mozzarella e molho de tomate',
            price: 28.90,
            imageUrl: 'https://images.unsplash.com/photo-1628840042765-356cda07504e',
            inStock: true,
            ingredients: defaultIngredients,
            category: 'Pizzas Especiais',
            allowsMultipleFlavors: true
          },
          {
            id: '3',
            businessId: businessData.id,
            name: 'Quatro Queijos',
            description: 'Mozzarella, gorgonzola, parmesão e provolone',
            price: 32.90,
            imageUrl: 'https://images.unsplash.com/photo-1513104890138-7c749659a591',
            inStock: true,
            ingredients: defaultIngredients,
            category: 'Pizzas Especiais',
            allowsMultipleFlavors: true
          }
        ];

        setProducts(staticPizzas);

        // Set static sizes with more options
        const staticSizes: Size[] = [
          {
            id: 'p',
            businessId: businessData.id,
            name: 'Pequena',
            maxFlavors: 1,
            price: 25.90,
            description: '20cm - 4 fatias'
          },
          {
            id: 'm',
            businessId: businessData.id,
            name: 'Média',
            maxFlavors: 2,
            price: 35.90,
            description: '25cm - 6 fatias'
          },
          {
            id: 'g',
            businessId: businessData.id,
            name: 'Grande',
            maxFlavors: 3,
            price: 45.90,
            description: '35cm - 8 fatias'
          },
          {
            id: 'f',
            businessId: businessData.id,
            name: 'Família',
            maxFlavors: 4,
            price: 55.90,
            description: '45cm - 12 fatias'
          }
        ];

        setSizes(staticSizes);
      } catch (err) {
        console.error('Error loading business:', err);
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    }

    loadBusinessData();
  }, [businessSlug, dispatch, navigate]);

  const handleSubmitReview = async (rating: number, comment: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        // Redirect to login if not authenticated
        navigate('/login', { state: { returnTo: `/business/${businessSlug}` } });
        return;
      }

      const { error: reviewError } = await supabase
        .from('reviews')
        .insert({
          business_id: business?.id,
          user_id: session.user.id,
          rating,
          comment
        });

      if (reviewError) {
        if (reviewError.code === '23505') { // Unique violation
          alert('Você já avaliou este estabelecimento');
        } else {
          console.error('Review error:', reviewError);
          alert('Não foi possível enviar sua avaliação. Por favor, tente novamente.');
        }
        return;
      }

      setShowReviewForm(false);
      // Reload business data to update rating
      window.location.reload();
    } catch (error) {
      console.error('Review submission error:', error);
      alert('Ocorreu um erro ao enviar sua avaliação. Por favor, tente novamente.');
    }
  };

  const isBusinessOpen = () => {
    if (!business?.businessHours) return true;

    const now = new Date();
    const dayOfWeek = now.getDay();
    const diaSemana = weekDayMap[dayOfWeek];
    const horarioHoje = business.businessHours[diaSemana];

    if (!horarioHoje) return false;

    const horaAtual = now.getHours();
    const minutoAtual = now.getMinutes();
    const [horaAbre, minutoAbre] = horarioHoje.open.split(':').map(Number);
    const [horaFecha, minutoFecha] = horarioHoje.close.split(':').map(Number);

    const minutosAgora = horaAtual * 60 + minutoAtual;
    const minutosAbre = horaAbre * 60 + minutoAbre;
    const minutosFecha = horaFecha * 60 + minutoFecha;

    return minutosAgora >= minutosAbre && minutosAgora <= minutosFecha;
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

  if (error || !business) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-600">{error || 'Business not found'}</p>
          <a href="/" className="text-red-600 hover:text-red-700 mt-2 inline-block">
            Voltar para a Lista
          </a>
        </div>
      </div>
    );
  }

  // Group products by category
  const groupedProducts = products.reduce((acc, product) => {
    const category = product.category || 'Outros';
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(product);
    return acc;
  }, {} as Record<string, Product[]>);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <div className="flex items-center space-x-4">
          <img
            src={business.logoUrl}
            alt={business.name}
            className="w-24 h-24 rounded-full object-cover"
          />
          <div className="flex-1">
            <h1 className="text-3xl font-bold mb-2">{business.name}</h1>
            <div className="flex items-center space-x-4">
              <StarRating 
                rating={business.rating || 0} 
                reviewCount={business.reviewCount}
                size="lg"
              />
              <button
                onClick={() => setShowReviewForm(true)}
                className="flex items-center space-x-2 text-red-600 hover:text-red-700"
              >
                <MessageCircle size={20} />
                <span>Avaliar</span>
              </button>
            </div>
            <div className="mt-2 space-y-2">
              {business.businessHours && (
                <BusinessHoursComponent hours={business.businessHours} />
              )}
              <p className="text-gray-600">
                Taxa de entrega: R$ {business.deliveryFee.toFixed(2)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {!isBusinessOpen() && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-8">
          <p className="text-red-600 text-center font-medium">
            Este estabelecimento está fechado no momento. 
            Volte no horário de funcionamento para fazer seu pedido.
          </p>
        </div>
      )}

      {Object.entries(groupedProducts).map(([category, categoryProducts]) => (
        <div key={category} className="mb-8">
          <h2 className="text-2xl font-bold mb-4">{category}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {categoryProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                sizes={business.type === 'pizzaria' ? sizes : undefined}
                availableProducts={products}
                disabled={!isBusinessOpen()}
              />
            ))}
          </div>
        </div>
      ))}

      {showReviewForm && (
        <ReviewForm
          onSubmit={handleSubmitReview}
          onCancel={() => setShowReviewForm(false)}
        />
      )}
    </div>
  );
}

export default Menu;