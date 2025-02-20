import React from 'react';
import { Clock } from 'lucide-react';
import { BusinessHours as BusinessHoursType } from '../types';

interface BusinessHoursProps {
  hours: BusinessHoursType;
}

const weekDayMap = {
  0: 'sunday',
  1: 'monday',
  2: 'tuesday',
  3: 'wednesday',
  4: 'thursday',
  5: 'friday',
  6: 'saturday'
} as const;

const diasSemana = {
  sunday: 'Domingo',
  monday: 'Segunda-feira',
  tuesday: 'Terça-feira',
  wednesday: 'Quarta-feira',
  thursday: 'Quinta-feira',
  friday: 'Sexta-feira',
  saturday: 'Sábado'
};

export function BusinessHours({ hours }: BusinessHoursProps) {
  const isOpen = () => {
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

    // Converter horários para minutos para comparação
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    const [openHour, openMinute] = horarioHoje.open.split(':').map(Number);
    const [closeHour, closeMinute] = horarioHoje.close.split(':').map(Number);

    const currentMinutes = currentHour * 60 + currentMinute;
    const openMinutes = openHour * 60 + openMinute;
    const closeMinutes = closeHour * 60 + closeMinute;

    return currentMinutes >= openMinutes && currentMinutes <= closeMinutes;
  };

  // Verificar se há pelo menos um horário configurado
  const hasAnyHours = Object.values(hours || {}).some(horario => horario !== null);

  // Se não houver nenhum horário configurado, não mostrar o componente
  if (!hasAnyHours) return null;

  return (
    <div className="flex items-center space-x-2">
      <Clock className="h-5 w-5 text-gray-400" />
      <div>
        <span className={`text-sm font-semibold ${
          isOpen() ? 'text-green-600' : 'text-red-600'
        }`}>
          {isOpen() ? 'Aberto agora' : 'Fechado'}
        </span>
        <div className="text-sm text-gray-500">
          {Object.entries(hours).map(([day, horario]) => 
            horario && (
              <div key={day}>
                {diasSemana[day as keyof typeof diasSemana]}: {horario.open} - {horario.close}
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
}