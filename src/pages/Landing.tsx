import React from 'react';
import { Link } from 'react-router-dom';
import { 
  Store, 
  Truck, 
  Star, 
  Package, 
  Clock, 
  Users, 
  Shield, 
  Smartphone,
  CheckCircle,
  ArrowRight
} from 'lucide-react';
import { SubscriptionPlans } from '../components/SubscriptionPlans';

const features = [
  {
    icon: Store,
    title: 'Gestão Completa',
    description: 'Gerencie seu cardápio, pedidos e entregas em um só lugar'
  },
  {
    icon: Truck,
    title: 'Sistema de Entregas',
    description: 'Controle de entregadores e rastreamento em tempo real'
  },
  {
    icon: Star,
    title: 'Avaliações',
    description: 'Receba feedback dos clientes e melhore seu serviço'
  },
  {
    icon: Package,
    title: 'Cardápio Digital',
    description: 'Cardápio online atualizado em tempo real'
  },
  {
    icon: Clock,
    title: 'Horários Flexíveis',
    description: 'Configure seus horários de funcionamento'
  },
  {
    icon: Users,
    title: 'Multi-usuários',
    description: 'Acesso para toda sua equipe'
  }
];

const testimonials = [
  {
    name: 'João Silva',
    business: 'Pizzaria do João',
    photo: 'https://images.unsplash.com/photo-1560250097-0b93528c311a',
    testimonial: 'Desde que começamos a usar o sistema, nossas vendas aumentaram 40%. A gestão ficou muito mais simples.'
  },
  {
    name: 'Maria Santos',
    business: 'Pastelaria da Maria',
    photo: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2',
    testimonial: 'O sistema é muito intuitivo e nos ajudou a organizar melhor os pedidos. Recomendo!'
  },
  {
    name: 'Pedro Oliveira',
    business: 'Creperia do Pedro',
    photo: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e',
    testimonial: 'O suporte é excelente e o sistema tem todas as funcionalidades que precisamos.'
  }
];

function Landing() {
  return (
    <div className="bg-white">
      {/* Hero Section */}
      <div className="relative bg-red-600 text-white">
        <div className="absolute inset-0 bg-black opacity-50"></div>
        <div className="container mx-auto px-4 py-24 relative">
          <div className="max-w-3xl">
            <h1 className="text-5xl font-bold mb-6">
              Transforme seu Negócio com a Melhor Plataforma de Delivery
            </h1>
            <p className="text-xl mb-8">
              Gerencie pedidos, entregas e seu cardápio em um só lugar. 
              Aumente suas vendas e fidelize seus clientes.
            </p>
            <div className="flex space-x-4">
              <Link
                to="/register"
                className="inline-flex items-center px-8 py-4 bg-white text-red-600 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
              >
                Cadastrar Estabelecimento
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
              <Link
                to="/businesses"
                className="inline-flex items-center px-8 py-4 bg-transparent border-2 border-white text-white rounded-lg font-semibold hover:bg-white hover:text-red-600 transition-colors"
              >
                Ver Estabelecimentos
                <Store className="ml-2 h-5 w-5" />
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="container mx-auto px-4 py-16">
        <h2 className="text-3xl font-bold text-center mb-12">
          Tudo que você precisa para crescer
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <div key={index} className="p-6 border rounded-lg hover:border-red-600 transition-colors">
              <feature.icon className="h-12 w-12 text-red-600 mb-4" />
              <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
              <p className="text-gray-600">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Benefits Section */}
      <div className="bg-gray-50 py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">
            Por que escolher nossa plataforma?
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="flex items-start space-x-4">
              <Shield className="h-8 w-8 text-red-600 flex-shrink-0" />
              <div>
                <h3 className="text-xl font-semibold mb-2">Segurança Total</h3>
                <p className="text-gray-600">
                  Seus dados estão protegidos com a mais alta tecnologia em segurança.
                  Backups automáticos e criptografia de ponta a ponta.
                </p>
              </div>
            </div>
            <div className="flex items-start space-x-4">
              <Smartphone className="h-8 w-8 text-red-600 flex-shrink-0" />
              <div>
                <h3 className="text-xl font-semibold mb-2">100% Mobile</h3>
                <p className="text-gray-600">
                  Acesse de qualquer lugar, a qualquer momento. 
                  Interface responsiva que funciona em todos os dispositivos.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Testimonials Section */}
      <div className="container mx-auto px-4 py-16">
        <h2 className="text-3xl font-bold text-center mb-12">
          O que nossos clientes dizem
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <div key={index} className="p-6 border rounded-lg">
              <div className="flex items-center space-x-4 mb-4">
                <img
                  src={testimonial.photo}
                  alt={testimonial.name}
                  className="w-16 h-16 rounded-full object-cover"
                />
                <div>
                  <h3 className="font-semibold">{testimonial.name}</h3>
                  <p className="text-gray-600">{testimonial.business}</p>
                </div>
              </div>
              <p className="text-gray-700">"{testimonial.testimonial}"</p>
            </div>
          ))}
        </div>
      </div>

      {/* Stats Section */}
      <div className="bg-red-600 text-white py-16">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            <div>
              <div className="text-4xl font-bold mb-2">500+</div>
              <div className="text-red-100">Estabelecimentos</div>
            </div>
            <div>
              <div className="text-4xl font-bold mb-2">50.000+</div>
              <div className="text-red-100">Pedidos Entregues</div>
            </div>
            <div>
              <div className="text-4xl font-bold mb-2">98%</div>
              <div className="text-red-100">Clientes Satisfeitos</div>
            </div>
          </div>
        </div>
      </div>

      {/* Features List Section */}
      <div className="container mx-auto px-4 py-16">
        <h2 className="text-3xl font-bold text-center mb-12">
          Recursos que fazem a diferença
        </h2>
        <div className="max-w-3xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[
              'Gestão de pedidos em tempo real',
              'Sistema de avaliações',
              'Controle de entregadores',
              'Relatórios detalhados',
              'Cardápio digital personalizado',
              'Integração com WhatsApp',
              'Gestão de estoque',
              'Suporte especializado'
            ].map((feature, index) => (
              <div key={index} className="flex items-center space-x-3">
                <CheckCircle className="h-5 w-5 text-green-500" />
                <span>{feature}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-gray-50 py-16">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-6">
            Pronto para transformar seu negócio?
          </h2>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Escolha o plano ideal para seu estabelecimento e comece a usar hoje mesmo.
            Sem contratos longos, cancele quando quiser.
          </p>
          <Link
            to="/register"
            className="inline-flex items-center px-8 py-4 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition-colors"
          >
            Começar Agora
            <ArrowRight className="ml-2 h-5 w-5" />
          </Link>
        </div>
      </div>

      {/* FAQ Section */}
      <div className="container mx-auto px-4 py-16">
        <h2 className="text-3xl font-bold text-center mb-12">
          Perguntas Frequentes
        </h2>
        <div className="max-w-3xl mx-auto space-y-6">
          {[
            {
              question: 'Preciso instalar algum software?',
              answer: 'Não, nossa plataforma é 100% web. Você só precisa de um navegador e conexão com a internet.'
            },
            {
              question: 'Posso cancelar a qualquer momento?',
              answer: 'Sim, você pode cancelar sua assinatura quando quiser, sem multas ou taxas adicionais.'
            },
            {
              question: 'Como funciona o suporte?',
              answer: 'Oferecemos suporte por email, chat e WhatsApp, com tempos de resposta variando de acordo com seu plano.'
            },
            {
              question: 'Preciso de equipamentos específicos?',
              answer: 'Não, você pode usar qualquer computador, tablet ou smartphone com acesso à internet.'
            }
          ].map((faq, index) => (
            <div key={index} className="border rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-2">{faq.question}</h3>
              <p className="text-gray-600">{faq.answer}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default Landing;