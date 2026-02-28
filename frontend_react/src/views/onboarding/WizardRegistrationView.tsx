import React, { useState } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import WizardStep0 from './WizardStep0';
import WizardStep1 from './WizardStep1';
import WizardStep2 from './WizardStep2';
import WizardStep3 from './WizardStep3';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export interface WizardFormData {
    email: string;
    password: string;
    company_name: string;
    industry: string;
    company_size: string;
    sales_model: string;
    use_cases: string[];
    role: string;
    phone_number: string;
    acquisition_source: string;
}

export default function WizardRegistrationView() {
    const [currentStep, setCurrentStep] = useState(0);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [globalError, setGlobalError] = useState('');

    const navigate = useNavigate();
    const { login } = useAuth();

    const {
        register,
        handleSubmit,
        watch,
        setValue,
        trigger,
        formState: { errors },
    } = useForm<WizardFormData>({
        defaultValues: {
            use_cases: [],
        },
    });

    const handleNext = async () => {
        let isValid = false;
        if (currentStep === 0) {
            isValid = await trigger(['email', 'password']);
        } else if (currentStep === 1) {
            isValid = await trigger(['company_name', 'industry', 'company_size']);
        } else if (currentStep === 2) {
            isValid = await trigger(['use_cases', 'sales_model']);
            // Custom validation for use_cases if needed
            const currentUseCases = watch('use_cases');
            if (!currentUseCases || currentUseCases.length === 0) {
                setGlobalError('Por favor selecciona al menos un caso de uso.');
                isValid = false;
            } else {
                setGlobalError('');
            }
        }

        if (isValid) {
            setCurrentStep((prev) => prev + 1);
            setGlobalError('');
        }
    };

    const handlePrev = () => {
        setCurrentStep((prev) => prev - 1);
        setGlobalError('');
    };

    const onSubmit: SubmitHandler<WizardFormData> = async (data) => {
        setIsSubmitting(true);
        setGlobalError('');
        try {
            const response = await axios.post(`${API_URL}/auth/register/wizard`, data);
            if (response.status === 200 && response.data.access_token) {
                // Zero Friction Activation: Use AuthContext
                login(response.data.access_token, response.data.user);

                // Also set it dynamically in axios default headers just to be absolutely sure for parallel requests
                axios.defaults.headers.common['Authorization'] = `Bearer ${response.data.access_token}`;

                // Soft redirect to dashboard without reloading
                navigate('/crm');
            }
        } catch (err: any) {
            setGlobalError(err.response?.data?.detail || 'Ocurrió un error al crear tu cuenta. Por favor, intenta de nuevo.');
            setIsSubmitting(false);
        }
    };

    return (
        <div className="flex min-h-screen bg-[#050505] text-white font-sans">
            {/* LEFT: Form Section */}
            <div className="w-full lg:w-1/2 flex flex-col justify-center px-8 sm:px-16 md:px-24 lg:px-32 relative z-10">
                <div className="max-w-md w-full mx-auto">
                    {/* Progress Indicators */}
                    <div className="flex gap-2 mb-12">
                        {[0, 1, 2, 3].map((stepIdx) => (
                            <div
                                key={stepIdx}
                                className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${stepIdx <= currentStep ? 'bg-medical-500' : 'bg-gray-800'
                                    }`}
                            />
                        ))}
                    </div>

                    {globalError && (
                        <div className="mb-6 p-4 bg-red-500/10 border border-red-500/50 rounded-lg text-red-500 text-sm animate-fade-in">
                            {globalError}
                        </div>
                    )}

                    <form onSubmit={handleSubmit(onSubmit)}>
                        {currentStep === 0 && (
                            <WizardStep0 register={register} errors={errors} onNext={handleNext} />
                        )}
                        {currentStep === 1 && (
                            <WizardStep1
                                register={register}
                                errors={errors}
                                watch={watch}
                                onNext={handleNext}
                                onPrev={handlePrev}
                            />
                        )}
                        {currentStep === 2 && (
                            <WizardStep2
                                register={register}
                                errors={errors}
                                watch={watch}
                                setValue={setValue}
                                onNext={handleNext}
                                onPrev={handlePrev}
                            />
                        )}
                        {currentStep === 3 && (
                            <WizardStep3
                                register={register}
                                errors={errors}
                                isSubmitting={isSubmitting}
                                onPrev={handlePrev}
                            />
                        )}
                    </form>
                </div>
            </div>

            {/* RIGHT: Glassmorphism / Branding Panel */}
            <div className="hidden lg:flex w-1/2 relative bg-gradient-to-br from-[#0a0f18] to-[#050505] overflow-hidden items-center justify-center p-16">
                {/* Glow Effects */}
                <div className="absolute top-1/4 -right-20 w-[40rem] h-[40rem] bg-medical-600/20 rounded-full blur-[120px] pointer-events-none" />
                <div className="absolute bottom-1/4 -left-20 w-[30rem] h-[30rem] bg-blue-900/20 rounded-full blur-[100px] pointer-events-none" />

                {/* Glass Card */}
                <div className="relative z-10 bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-3xl p-12 max-w-lg shadow-[0_8px_32px_0_rgba(0,0,0,0.36)] animate-slide-up">
                    <div className="w-16 h-16 bg-gradient-to-tr from-medical-600 to-blue-400 rounded-2xl mb-8 flex items-center justify-center shadow-lg shadow-medical-500/30">
                        <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                    </div>

                    <h3 className="text-4xl font-bold leading-tight mb-6 text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-400">
                        Acelera tus ventas un 60% en los primeros 14 días.
                    </h3>

                    <p className="text-gray-400 text-lg leading-relaxed mb-8">
                        Únete a cientos de empresas que ya automatizaron su pipeline, centralizaron su WhatsApp y multiplicaron su facturación con Nexus CRM.
                    </p>

                    <div className="flex items-center gap-4">
                        <div className="flex -space-x-3">
                            {[1, 2, 3, 4].map((i) => (
                                <div key={i} className={`w-10 h-10 rounded-full border-2 border-[#0a0f18] bg-gray-800 flex items-center justify-center text-xs font-medium z-[${5 - i}] overflow-hidden`}>
                                    <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${i + 10}&backgroundColor=b6e3f4,c0aede,d1d4f9`} alt="avatar" />
                                </div>
                            ))}
                        </div>
                        <div className="text-sm font-medium text-gray-400">
                            <span className="text-white">+500</span> empresas activas
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
