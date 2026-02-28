import React from 'react';
import { UseFormRegister, FieldErrors } from 'react-hook-form';
import { WizardFormData } from './WizardRegistrationView';

interface Props {
    register: UseFormRegister<WizardFormData>;
    errors: FieldErrors<WizardFormData>;
    onNext: () => void;
}

export default function WizardStep0({ register, errors, onNext }: Props) {
    return (
        <div className="animate-fade-in space-y-6">
            <div>
                <h2 className="text-3xl font-bold mb-2">Comienza tu Prueba Gratuita</h2>
                <p className="text-gray-400">14 días de acceso total. Sin tarjeta de crédito.</p>
            </div>

            <div className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Email Profesional</label>
                    <input
                        type="email"
                        {...register('email')}
                        className="w-full bg-[#1a1a1a] border border-gray-800 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-medical-500 focus:ring-1 focus:ring-medical-500 transition-colors"
                        placeholder="ceo@tuempresa.com"
                    />
                    {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>}
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Contraseña</label>
                    <input
                        type="password"
                        {...register('password')}
                        className="w-full bg-[#1a1a1a] border border-gray-800 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-medical-500 focus:ring-1 focus:ring-medical-500 transition-colors"
                        placeholder="••••••••"
                    />
                    {errors.password && <p className="text-red-500 text-sm mt-1">{errors.password.message}</p>}
                </div>
            </div>

            <button
                type="button"
                onClick={onNext}
                className="w-full bg-medical-600 hover:bg-medical-500 text-white font-medium py-3 rounded-lg shadow-lg shadow-medical-500/30 transition-all duration-200 mt-8"
            >
                Continuar
            </button>
        </div>
    );
}
