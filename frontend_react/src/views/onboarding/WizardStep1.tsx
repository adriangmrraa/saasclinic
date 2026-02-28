import React from 'react';
import { UseFormRegister, FieldErrors, UseFormWatch } from 'react-hook-form';
import { WizardFormData } from './WizardRegistrationView';

interface Props {
    register: UseFormRegister<WizardFormData>;
    errors: FieldErrors<WizardFormData>;
    watch: UseFormWatch<WizardFormData>;
    onNext: () => void;
    onPrev: () => void;
}

export default function WizardStep1({ register, errors, watch, onNext, onPrev }: Props) {
    const companySize = watch('company_size');

    return (
        <div className="animate-fade-in space-y-6">
            <div>
                <h2 className="text-3xl font-bold mb-2">Sobre tu Empresa</h2>
                <p className="text-gray-400">Ayúdanos a personalizar tu experiencia en el CRM.</p>
            </div>

            <div className="space-y-5">
                <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Nombre de la Empresa / Clínica</label>
                    <input
                        type="text"
                        {...register('company_name')}
                        className="w-full bg-[#1a1a1a] border border-gray-800 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-medical-500 focus:ring-1 focus:ring-medical-500 transition-colors"
                        placeholder="Ej: Dentalogic S.A."
                    />
                    {errors.company_name && <p className="text-red-500 text-sm mt-1">{errors.company_name.message}</p>}
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Industria</label>
                    <select
                        {...register('industry')}
                        className="w-full bg-[#1a1a1a] border border-gray-800 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-medical-500 focus:ring-1 focus:ring-medical-500 transition-colors appearance-none"
                    >
                        <option value="">Selecciona una industria</option>
                        <option value="Clinica Dental">Clínica Dental</option>
                        <option value="Agencia Marketing">Agencia de Marketing</option>
                        <option value="SaaS / Software">SaaS / Software</option>
                        <option value="Real Estate">Bienes Raíces</option>
                        <option value="Salud / Bienestar">Salud y Bienestar</option>
                        <option value="Otro">Otro</option>
                    </select>
                    {errors.industry && <p className="text-red-500 text-sm mt-1">{errors.industry.message}</p>}
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Tamaño de la Empresa</label>
                    <div className="grid grid-cols-2 gap-3">
                        {['1-10', '11-50', '51-200', '201+'].map((size) => (
                            <label
                                key={size}
                                className={`cursor-pointer border rounded-lg px-4 py-3 text-center transition-all ${companySize === size
                                    ? 'border-medical-500 bg-medical-500/10 text-white'
                                    : 'border-gray-800 bg-[#1a1a1a] text-gray-400 hover:border-gray-600'
                                    }`}
                            >
                                <input
                                    type="radio"
                                    value={size}
                                    {...register('company_size')}
                                    className="hidden"
                                />
                                {size} empleados
                            </label>
                        ))}
                    </div>
                    {errors.company_size && <p className="text-red-500 text-sm mt-1">{errors.company_size.message}</p>}
                </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 mt-8">
                <button
                    type="button"
                    onClick={onPrev}
                    className="w-full sm:w-1/3 bg-[#1a1a1a] border border-gray-800 hover:bg-gray-800 text-white font-medium py-3 rounded-lg transition-all duration-200"
                >
                    Atrás
                </button>
                <button
                    type="button"
                    onClick={onNext}
                    className="w-full sm:w-2/3 bg-medical-600 hover:bg-medical-500 text-white font-medium py-3 rounded-lg shadow-lg shadow-medical-500/30 transition-all duration-200"
                >
                    Siguiente
                </button>
            </div>
        </div>
    );
}
