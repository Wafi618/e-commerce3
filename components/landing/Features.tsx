import React from 'react';
import { Truck, ShieldCheck, Headphones, CreditCard } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';

export const Features = () => {
    const { darkMode } = useTheme();

    const features = [
        {
            icon: <Truck className="w-8 h-8 text-blue-500" />,
            title: "Fast Delivery",
            description: "Quick and reliable shipping across Bangladesh."
        },
        {
            icon: <ShieldCheck className="w-8 h-8 text-green-500" />,
            title: "Premium Quality",
            description: "100% authentic and high-quality products."
        },
        {
            icon: <Headphones className="w-8 h-8 text-purple-500" />,
            title: "24/7 Support",
            description: "Friendly customer support whenever you need help."
        },
        {
            icon: <CreditCard className="w-8 h-8 text-orange-500" />,
            title: "Secure Payment",
            description: "Multiple secure payment options including COD."
        }
    ];

    return (
        <div className={`py-16 ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                    {features.map((feature, index) => (
                        <div
                            key={index}
                            className={`p-6 rounded-2xl border transition-all duration-300 hover:-translate-y-1 hover:shadow-xl ${darkMode
                                    ? 'bg-gray-900 border-gray-700 hover:border-blue-500/50 hover:shadow-blue-900/20'
                                    : 'bg-gray-50 border-gray-200 hover:border-blue-200 hover:shadow-blue-100'
                                }`}
                        >
                            <div className={`w-14 h-14 rounded-xl flex items-center justify-center mb-4 ${darkMode ? 'bg-gray-800' : 'bg-white shadow-sm'
                                }`}>
                                {feature.icon}
                            </div>
                            <h3 className={`text-lg font-bold mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                                {feature.title}
                            </h3>
                            <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                {feature.description}
                            </p>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};
