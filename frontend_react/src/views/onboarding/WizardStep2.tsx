import React from 'react';
import { UseFormRegister, FieldErrors, UseFormWatch, UseFormSetValue } from 'react-hook-form';
import { WizardFormData } from './WizardRegistrationView';

interface Props {
    register: UseFormRegister<WizardFormData>;
    errors: FieldErrors<WizardFormData>;
    watch: UseFormWatch<WizardFormData>;
    setValue: UseFormSetValue<WizardFormData>;
    onNext: () => void;
    onPrev: () => void;
}

const USE_CASES = [
    { id: 'agenda', label: 'Gestión de Agenda y Citas' },
    { id: 'ventas', label: 'Pipeline de Ventas' },
    { id: 'whatsapp', label: 'Mensajería WhatsApp API' },
    { id: 'marketing', label: 'Marketing Automatizado' },
    { id: 'analiticas', label: 'Reportes y Métricas' },
    { id: 'otro', label: 'Otros casos de uso' },
];

export default function WizardStep2({ register, errors, watch, setValue, onNext, onPrev }: Props) {
    const selectedUseCases = watch('use_cases') || [];

    const toggleUseCase = (id: string) => {
        const current = new Set(selectedUseCases);
        if (current.has(id)) {
            current.delete(id);
        } else {
            current.add(id);
        }
        setValue('use_cases', Array.from(current), { shouldValidate: true });
    };

    return (
        <div className="animate-fade-in space-y-6">
            <div>
                <h2 className="text-3xl font-bold mb-2">Tus Necesidades</h2>
                <p className="text-gray-400">¿Qué esperas lograr con el CRM?</p>
            </div>

            <div className="space-y-6">
                <div>
                    <label className="block text-sm font-medium text-gray-300 mb-3">Principales casos de uso (Selecciona varios)</label>
                    <div className="grid grid-cols-2 gap-3">
                        {USE_CASES.map((useCase) => {
                            const isSelected = selectedUseCases.includes(useCase.id);
                            return (
                                <button
                                    key={useCase.id}
                                    type="button"
                                    onClick={() => toggleUseCase(useCase.id)}
                                    className={`text-left p-4 rounded-xl border transition-all duration-200 ${isSelected
                                        ? 'bg-medical-500/10 border-medical-500 shadow-[0_0_15px_rgba(0,102,204,0.15)] text-white'
                                        : 'bg-[#1a1a1a] border-gray-800 text-gray-400 hover:border-gray-600'
                                        }`}
                                >
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm font-medium">{useCase.label}</span>
                                        <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${isSelected ? 'border-medical-500 bg-medical-500' : 'border-gray-600'}`}>
                                            {isSelected && <div className="w-1.5 h-1.5 bg-white rounded-full"></div>}
                                        </div>
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                    {/* Hidden input to register the array with rhf */}
                    <input type="hidden" {...register('use_cases')} />
                    {errors.use_cases && <p className="text-red-500 text-sm mt-2">{errors.use_cases.message}</p>}
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Modelo de Ventas Principal</label>
                    <select
                        {...register('sales_model')}
                        className="w-full bg-[#1a1a1a] border border-gray-800 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-medical-500 focus:ring-1 focus:ring-medical-500 transition-colors appearance-none"
                    >
                        <option value="">Selecciona tu modelo</option>
                        <option value="B2B">B2B (Empresa a Empresa)</option>
                        <option value="B2C">B2C (Empresa a Consumidor Directo)</option>
                        <option value="Clinica">Pacientes (Clínica / Consultorio)</option>
                        <option value="Hibrido">Híbrido</option>
                    </select>
                    {errors.sales_model && <p className="text-red-500 text-sm mt-1">{errors.sales_model.message}</p>}
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
