import React from 'react';
import { Truck, Smartphone } from 'lucide-react';
import { Link } from 'react-router-dom';

export function DriverAccess() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <Truck className="h-12 w-12 text-red-600" />
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Área do Entregador
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Acesse seu painel de entregas
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <div className="space-y-6">
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Como acessar?
              </h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>1. Use seu número de telefone cadastrado</li>
                <li>2. Digite a senha fornecida pelo estabelecimento</li>
                <li>3. Acesse o painel de entregas</li>
              </ul>
            </div>

            <Link
              to="/driver/login"
              className="w-full flex justify-center items-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
            >
              <Smartphone className="h-5 w-5 mr-2" />
              Acessar Painel
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default DriverAccess;