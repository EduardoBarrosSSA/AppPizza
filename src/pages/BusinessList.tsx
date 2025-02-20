import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { Pizza, UtensilsCrossed, Cookie, Sandwich, MapPin, Clock, Search } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Business, BusinessHours } from '../types';
import { StarRating } from '../components/StarRating';

const weekDayMap = {
  0: 'sunday',
  1: 'monday',
  2: 'tuesday',
  3: 'wednesday',
  4: 'thursday',
  5: 'friday',
  6: 'saturday'
} as const;

const businessTypes = {
  pizzaria: { icon: Pizza, label: 'Pizzarias' },
  pastelaria: { icon: Cookie, label: 'Pastelarias' },
  crepe: { icon: UtensilsCrossed, label: 'Creperias' },
  acaraje: { icon: Sandwich, label: 'Acarajé' },
} as const;

export function BusinessList() {
  const { dispatch } = useCart();
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [neighborhoods, setNeighborhoods] = useState<string[]>([]);
  const [selectedNeighborhood, setSelectedNeighborhood] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    async function loadBusinesses() {
      try {
        const { data, error: businessError } = await supabase
          .from('businesses')
          .select('*, reviews(rating), business_hours');

        if (businessError) {
          throw businessError;
        }

        if (data) {
          const transformedBusinesses: Business[] = data.map(b => {
            const reviews = b.reviews as { rating: number }[] || [];
            const avgRating = reviews.length > 0
              ? reviews.reduce((acc, rev) => acc + rev.rating, 0) / reviews.length
              : 0;

            return {
              id: b.id,
              name: b.name,
              type: b.type,
              category_id: b.category_id,
              logoUrl: b.logo_url,
              deliveryFee: b.delivery_fee,
              whatsapp: b.whatsapp,
              rating: avgRating,
              reviewCount: reviews.length,
              neighborhood: b.neighborhood,
              city: b.city,
              state: b.state,
              businessHours: b.business_hours
            };
          });

          setBusinesses(transformedBusinesses);

          // Extrair bairros únicos
          const uniqueNeighborhoods = Array.from(
            new Set(
              transformedBusinesses
                .map(b => b.neighborhood)
                .filter(Boolean)
                .sort()
            )
          );
          setNeighborhoods(uniqueNeighborhoods);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load businesses');
      } finally {
        setLoading(false);
      }
    }

    loadBusinesses();
  }, []);

  const handleBusinessClick = (businessId: string) => {
    dispatch({ type: 'SET_BUSINESS', payload: businessId });
  };

  const isBusinessOpen = (hours: BusinessHours | undefined) => {
    // Se não houver horários definidos, consideramos aberto
    if (!hours) return true;

    // Verificar se há pelo menos um horário configurado
    const hasAnyHours = Object.values(hours).some(horario => horario !== null);
    if (!hasAnyHours) return true;

    const now = new Date();
    const dayOfWeek = now.getDay();
    const diaSemana = weekDayMap[dayOfWeek];
    const horarioHoje = hours[diaSemana];

    // Se não houver horário definido para hoje, está fechado
    if (!horarioHoje) return false;

    // Pegar hora atual no formato 24h
    const currentTime = now.toLocaleTimeString('pt-BR', { 
      hour12: false,
      hour: '2-digit',
      minute: '2-digit'
    });

    // Converter horários para minutos para comparação
    const [currentHour, currentMinute] = currentTime.split(':').map(Number);
    const [openHour, openMinute] = horarioHoje.open.split(':').map(Number);
    const [closeHour, closeMinute] = horarioHoje.close.split(':').map(Number);

    const currentMinutes = currentHour * 60 + currentMinute;
    const openMinutes = openHour * 60 + openMinute;
    const closeMinutes = closeHour * 60 + closeMinute;

    return currentMinutes >= openMinutes && currentMinutes <= closeMinutes;
  };

  const filteredBusinesses = businesses.filter(business => {
    const matchesType = !selectedType || business.type === selectedType;
    const matchesNeighborhood = !selectedNeighborhood || business.neighborhood === selectedNeighborhood;
    const matchesSearch = !searchTerm || 
      business.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      business.neighborhood?.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesType && matchesNeighborhood && matchesSearch;
  });

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-600">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Escolha um Estabelecimento</h1>
      
      {/* Filtros */}
      <div className="mb-8 space-y-4">
        {/* Barra de Pesquisa */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
          <input
            type="text"
            placeholder="Buscar por nome ou bairro..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-red-500 focus:border-red-500"
          />
        </div>

        {/* Filtros de Categoria e Bairro */}
        <div className="flex flex-wrap gap-4">
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setSelectedType(null)}
              className={`px-4 py-2 rounded-full flex items-center space-x-2 transition-colors ${
                selectedType === null
                  ? 'bg-red-600 text-white'
                  : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
              }`}
            >
              <span>Todos</span>
            </button>
            {Object.entries(businessTypes).map(([type, { icon: Icon, label }]) => (
              <button
                key={type}
                onClick={() => setSelectedType(type)}
                className={`px-4 py-2 rounded-full flex items-center space-x-2 transition-colors ${
                  selectedType === type
                    ? 'bg-red-600 text-white'
                    : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                }`}
              >
                <Icon className="h-5 w-5" />
                <span>{label}</span>
              </button>
            ))}
          </div>

          {neighborhoods.length > 0 && (
            <select
              value={selectedNeighborhood}
              onChange={(e) => setSelectedNeighborhood(e.target.value)}
              className="px-4 py-2 border rounded-lg focus:ring-red-500 focus:border-red-500"
            >
              <option value="">Todos os bairros</option>
              {neighborhoods.map(neighborhood => (
                <option key={neighborhood} value={neighborhood}>
                  {neighborhood}
                </option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* Lista de Estabelecimentos */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredBusinesses.map((business) => {
          const Icon = businessTypes[business.type as keyof typeof businessTypes].icon;
          const open = isBusinessOpen(business.businessHours);
          
          return (
            <Link
              key={business.id}
              to={`/business/${business.id}`}
              onClick={() => handleBusinessClick(business.id)}
              className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow relative"
            >
              {!open && (
                <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-10">
                  <div className="bg-red-600 text-white px-4 py-2 rounded-full font-semibold flex items-center space-x-2">
                    <Clock className="h-5 w-5" />
                    <span>Fechado</span>
                  </div>
                </div>
              )}
              <img
                src={business.logoUrl}
                alt={business.name}
                className="w-full h-48 object-cover"
              />
              <div className="p-4">
                <div className="flex items-center space-x-2 mb-2">
                  <Icon className="h-6 w-6 text-red-600" />
                  <h2 className="text-xl font-bold">{business.name}</h2>
                </div>
                <div className="mb-2">
                  <StarRating 
                    rating={business.rating || 0} 
                    reviewCount={business.reviewCount}
                  />
                </div>
                {business.neighborhood && (
                  <div className="flex items-center text-gray-600 mb-2">
                    <MapPin className="h-4 w-4 mr-1" />
                    <span className="text-sm">{business.neighborhood}</span>
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">
                    Taxa de entrega:
                  </span>
                  <span className="font-semibold text-red-600">
                    R$ {business.deliveryFee.toFixed(2)}
                  </span>
                </div>
              </div>
            </Link>
          );
        })}

        {filteredBusinesses.length === 0 && (
          <div className="col-span-full text-center py-8 text-gray-500">
            Nenhum estabelecimento encontrado com os filtros selecionados.
          </div>
        )}
      </div>
    </div>
  );
}

export default BusinessList;