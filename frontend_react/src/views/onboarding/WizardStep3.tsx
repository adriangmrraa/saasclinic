import React from 'react';
import { UseFormRegister, FieldErrors } from 'react-hook-form';
import { WizardFormData } from './WizardRegistrationView';

interface Props {
    register: UseFormRegister<WizardFormData>;
    errors: FieldErrors<WizardFormData>;
    isSubmitting: boolean;
    onPrev: () => void;
}

export default function WizardStep3({ register, errors, isSubmitting, onPrev }: Props) {
    return (
        <div className="animate-fade-in space-y-6">
            <div>
                <h2 className="text-3xl font-bold mb-2">Tu Perfil</h2>
                <p className="text-gray-400">Último paso para acceder a la plataforma.</p>
            </div>

            <div className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Tu Rol en la Empresa</label>
                    <select
                        {...register('role')}
                        className="w-full bg-[#1a1a1a] border border-gray-800 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-medical-500 focus:ring-1 focus:ring-medical-500 transition-colors appearance-none"
                    >
                        <option value="">Selecciona tu rol principal</option>
                        <option value="ceo">CEO / Founder</option>
                        <option value="manager">Gerente / Director Comercial</option>
                        <option value="setter">Closer / Setter de Ventas</option>
                        <option value="professional">Profesional de la Salud / Servicio</option>
                        <option value="other">Otro</option>
                    </select>
                    {errors.role && <p className="text-red-500 text-sm mt-1">{errors.role.message}</p>}
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Número de Teléfono</label>
                    <input
                        type="tel"
                        {...register('phone_number')}
                        className="w-full bg-[#1a1a1a] border border-gray-800 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-medical-500 focus:ring-1 focus:ring-medical-500 transition-colors"
                        placeholder="+1 234 567 890"
                    />
                    {errors.phone_number && <p className="text-red-500 text-sm mt-1">{errors.phone_number.message}</p>}
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">¿Cómo nos conociste?</label>
                    <select
                        {...register('acquisition_source')}
                        className="w-full bg-[#1a1a1a] border border-gray-800 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-medical-500 focus:ring-1 focus:ring-medical-500 transition-colors appearance-none"
                    >
                        <option value="">Selecciona una opción</option>
                        <option value="Google Search">Búsqueda en Google</option>
                        <option value="Meta Ads">Facebook / Instagram Ads</option>
                        <option value="YouTube">YouTube</option>
                        <option value="Referral">Recomendación de un amigo/colega</option>
                        <option value="Other">Otro</option>
                    </select>
                    {errors.acquisition_source && <p className="text-red-500 text-sm mt-1">{errors.acquisition_source.message}</p>}
                </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 mt-8">
                <button
                    type="button"
                    onClick={onPrev}
                    disabled={isSubmitting}
                    className="w-full sm:w-1/3 bg-[#1a1a1a] border border-gray-800 hover:bg-gray-800 text-white font-medium py-3 rounded-lg transition-all duration-200 disabled:opacity-50"
                >
                    Atrás
                </button>
                <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full sm:w-2/3 bg-medical-600 hover:bg-medical-500 text-white font-medium py-3 rounded-lg shadow-lg shadow-medical-500/30 transition-all duration-200 disabled:opacity-50 disabled:cursor-wait relative"
                >
                    {isSubmitting ? (
                        <span className="flex items-center justify-center">
                            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Creando Cuenta...
                        </span>
                    ) : (
                        'Comenzar Prueba Gratuita'
                    )}
                </button>
            </div>
        </div>
    );
}
