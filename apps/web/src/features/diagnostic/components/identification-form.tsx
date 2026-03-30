'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { User, Mail, CreditCard, ArrowRight, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface IdentificationFormProps {
  onSubmit: (data: { dni: string; name: string; email: string }) => Promise<void>;
  isLoading: boolean;
}

export function IdentificationForm({ onSubmit, isLoading }: IdentificationFormProps) {
  const [formData, setFormData] = useState({
    dni: '',
    name: '',
    email: '',
  });
  
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    // DNI validation
    if (!formData.dni) {
      newErrors.dni = 'DNI es requerido';
    } else if (!/^\d{8}$/.test(formData.dni)) {
      newErrors.dni = 'DNI debe tener 8 dígitos';
    }
    
    // Name validation
    if (!formData.name) {
      newErrors.name = 'Nombre es requerido';
    } else if (formData.name.length < 3) {
      newErrors.name = 'Nombre debe tener al menos 3 caracteres';
    }
    
    // Email validation
    if (!formData.email) {
      newErrors.email = 'Email es requerido';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Email inválido';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    await onSubmit(formData);
  };
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 space-y-6"
      >
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-bold text-gray-900">
            Identifícate para continuar
          </h2>
          <p className="text-sm text-gray-600">
            Necesitamos algunos datos para guardar tu progreso y resultados
          </p>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* DNI */}
          <div className="space-y-2">
            <Label htmlFor="dni" className="text-sm font-medium text-gray-700">
              DNI
            </Label>
            <div className="relative">
              <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <Input
                id="dni"
                type="text"
                placeholder="12345678"
                maxLength={8}
                value={formData.dni}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, '');
                  setFormData({ ...formData, dni: value });
                  if (errors.dni) setErrors({ ...errors, dni: '' });
                }}
                className={`pl-10 ${errors.dni ? 'border-red-500' : ''}`}
                disabled={isLoading}
              />
            </div>
            {errors.dni && (
              <p className="text-xs text-red-500">{errors.dni}</p>
            )}
          </div>
          
          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="name" className="text-sm font-medium text-gray-700">
              Nombres y Apellidos
            </Label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <Input
                id="name"
                type="text"
                placeholder="Juan Pérez García"
                value={formData.name}
                onChange={(e) => {
                  setFormData({ ...formData, name: e.target.value });
                  if (errors.name) setErrors({ ...errors, name: '' });
                }}
                className={`pl-10 ${errors.name ? 'border-red-500' : ''}`}
                disabled={isLoading}
              />
            </div>
            {errors.name && (
              <p className="text-xs text-red-500">{errors.name}</p>
            )}
          </div>
          
          {/* Email */}
          <div className="space-y-2">
            <Label htmlFor="email" className="text-sm font-medium text-gray-700">
              Correo Electrónico
            </Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <Input
                id="email"
                type="email"
                placeholder="juan@example.com"
                value={formData.email}
                onChange={(e) => {
                  setFormData({ ...formData, email: e.target.value });
                  if (errors.email) setErrors({ ...errors, email: '' });
                }}
                className={`pl-10 ${errors.email ? 'border-red-500' : ''}`}
                disabled={isLoading}
              />
            </div>
            {errors.email && (
              <p className="text-xs text-red-500">{errors.email}</p>
            )}
          </div>
          
          {/* Submit Button */}
          <Button
            type="submit"
            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 w-4 h-4 animate-spin" />
                Verificando...
              </>
            ) : (
              <>
                Continuar
                <ArrowRight className="ml-2 w-4 h-4" />
              </>
            )}
          </Button>
        </form>
        
        <p className="text-xs text-center text-gray-500">
          Si ya completaste el diagnóstico anteriormente, te llevaremos a tus resultados.
        </p>
      </motion.div>
    </div>
  );
}
