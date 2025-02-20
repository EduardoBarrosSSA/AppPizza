import React, { useState } from 'react';
import { Clock } from 'lucide-react';
import { BusinessHours } from '../types';

interface BusinessHoursFormProps {
  initialData: BusinessHours;
  onSave: (hours: BusinessHours) => Promise<void>;
}

export function BusinessHoursForm({ initialData, onSave }: BusinessHoursFormProps) {
  const [hours, setHours] = useState<BusinessHours>(initialData);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const diasSemana = {
    sunday: 'Domingo',
    monday: 'Segunda-feira',
    tuesday: 'Terça-feira',
    wednesday: 'Quarta-feira',
    thursday: 'Quinta-feira',
    friday: 'Sexta-feira',
    saturday: 'Sábado'
  };

  const handleToggleDay = (day: keyof BusinessHours) => {
    setHours(prev => ({
      ...prev,
      [day]: prev[day] ? null : { open: '09:00', close: '18:00' }
    }));
    setError(null);
    setSuccess(false);
  };

  const handleTimeChange = (
    day: keyof BusinessHours,
    field: 'open' | 'close',
    value: string
  ) => {
    setHours(prev => ({
      ...prev,
      [day]: prev[day] ? { ...prev[day]!, [field]: value } : null
    }));
    setError(null);
    setSuccess(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      // Validate hours before saving
      Object.entries(hours).forEach(([day, time]) => {
        if (time && (!time.open || !time.close)) {
          throw new Error(`Horários inválidos para ${diasSemana[day as keyof typeof diasSemana]}`);
        }
      });

      await onSave(hours);
      setSuccess(true);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Erro ao salvar horários de funcionamento');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center space-x-2 mb-6">
        <Clock className="h-6 w-6 text-red-600" />
        <h2 className="text-xl font-bold">Horário de Funcionamento</h2>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {(Object.keys(diasSemana) as Array<keyof typeof diasSemana>).map(day => (
          <div key={day} className="flex items-center space-x-4">
            <label className="flex items-center space-x-2 w-40">
              <input
                type="checkbox"
                checked={hours[day] !== null}
                onChange={() => handleToggleDay(day)}
                className="rounded text-red-600 focus:ring-red-500"
              />
              <span className="text-sm font-medium text-gray-700">
                {diasSemana[day]}
              </span>
            </label>

            {hours[day] && (
              <div className="flex items-center space-x-2">
                <input
                  type="time"
                  value={hours[day]?.open || ''}
                  onChange={(e) => handleTimeChange(day, 'open', e.target.value)}
                  className="p-2 border rounded-md focus:ring-red-500 focus:border-red-500"
                  required
                />
                <span className="text-gray-500">até</span>
                <input
                  type="time"
                  value={hours[day]?.close || ''}
                  onChange={(e) => handleTimeChange(day, 'close', e.target.value)}
                  className="p-2 border rounded-md focus:ring-red-500 focus:border-red-500"
                  required
                />
              </div>
            )}
          </div>
        ))}

        {error && (
          <div className="text-red-600 text-sm">{error}</div>
        )}

        {success && (
          <div className="text-green-600 text-sm">Horários salvos com sucesso!</div>
        )}

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-red-300"
          >
            {saving ? 'Salvando...' : 'Salvar Horários'}
          </button>
        </div>
      </form>
    </div>
  );
}